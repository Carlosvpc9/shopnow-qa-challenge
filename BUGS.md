# Bugs found

Sorted by priority, most important first. Assumption IDs (`S1`, `S2`…) refer to `ANALYSIS.md`.
Every bug below was reproduced through the UI (Playwright against a fresh `POST /api/test/reset`) and/or the API (curl), on the app as shipped. Test users: Ana (`ana@shopnow.test`) and Bruno (`bruno@shopnow.test`).

Product data used in the steps: #1 Ceramic mug $8.35 (stock 25) · #2 Bluetooth headphones $49.99 (stock 3) · #3 Basic T-shirt $14.35 · #8 Ergonomic chair $129.00 (stock 2). Seed order #3 belongs to Bruno.

Common checkout body (`SHIP`) used below:
```json
"shipping": { "name": "Ana Garcia", "address": "1234 Corrientes Ave" }, "card": { "number": "4242424242424242" }
```

| ID | Title | Source | Severity | Priority |
|---|---|---|---|---|
| BUG-01 | Payment over $100 shows "failed" but the card is charged and the order is created | Report 1 | Critical | P1 |
| BUG-02 | API accepts several coupons per order (stacking), down to a negative total | Found by me | Critical | P1 |
| BUG-03 | Checkout API doesn't validate stock or quantity: overselling, negative stock and negative totals | Found by me | Critical | P1 |
| BUG-04 | Any logged-in user can read any other user's order (IDOR) | Found by me | Critical | P1 |
| BUG-05 | Lowercase coupon code is "applied" with 0% discount | Report 2 | High | P1 |
| BUG-06 | Products added with "Add" from the catalog disappear on reload | Report 3 | High | P1 |
| BUG-07 | "One coupon per purchase" is bypassed in the UI after reloading the cart | Found by me | High | P2 |
| BUG-08 | Cart quantity can exceed available stock (catalog "Add" and repeated detail adds) | Found by me | Medium | P2 |
| BUG-09 | Line totals are truncated instead of rounded: user is charged 1 cent less | Found by me | Medium | P2 |
| BUG-10 | Order date uses the UTC day while the time uses Argentina time | Found by me | Medium | P2 |
| BUG-11 | Shipping form rejects accents, `ñ` and `º` with a misleading error | Found by me | Medium | P2 |
| BUG-12 | Product detail limits the quantity to 10 even when more stock is available (assumption) | Found by me | Low | P3 |
| BUG-13 | Declined payments are not recorded in "My payments" (assumption) | Found by me | Low | P3 |
| BUG-14 | API category filter is case-sensitive, unlike search (assumption) | Found by me | Low | P3 |

---

## BUG-01 — Payment over $100 shows "failed" but the card is charged and the order is created

- **Source:** user report 1 ("Sometimes when I pay it says it failed, but I still got charged.")
- **Type:** Integration / Logic
- **Severity:** Critical. The user is charged while being told the payment failed. Because the cart is kept and "Pay" is re-enabled, the obvious next step (retrying) charges them **again**.
- **Priority:** P1. Real money, a duplicate-charge risk, support tickets and chargebacks. It affects every order with a total over $100.
- **Preconditions:** logged in as Ana. Cart total > $100, e.g. 1 × Ergonomic chair ($129.00).
- **Steps to reproduce:**
  1. Open `/product/8` and click **Add to cart**.
  2. Go to `/checkout` and fill in name `Ana Garcia`, address `1234 Corrientes Ave`, card `4242424242424242`.
  3. Click **Pay**.
  4. Wait about 3 seconds. The error appears.
  5. Open **My orders** and **My payments**.
- **Expected result:** the user sees the outcome that actually happened. If the payment is approved, they get the order confirmation. A "failed" message never appears for an approved payment (S5), and a retry never charges twice (S6).
- **Actual result:** after 3 s, `checkout-error` shows *"We couldn't process your payment. Please try again."*, the cart still holds the chair and **Pay** is enabled again. Meanwhile the server finishes (at about 4 s) and responds `201`: order #4 and payment #4 for **$129.00, status `approved`**, appear in My orders and My payments. Clicking **Pay** again creates a second order and a second charge.
- **Evidence:** Playwright run. UI error text as above. Then `GET /api/payments` → `{ id: 4, orderId: 4, amount: 129, status: "approved" }`, and `GET /api/orders` returns 3 orders (2 seed + 1 new). `curl` time for the same checkout: `201` in **4.00 s**, versus 0.70 s for totals ≤ $100.
- **Automated test:** `tests/ui/checkout.spec.ts`: `[BUG-01] an approved payment over $100 shows the order confirmation, not an error`, `[BUG-01] the user is never charged while being told the payment failed`
- **Root cause in the code:** `app/web/src/pages/Checkout.tsx:8`. The client aborts the request with `PAYMENT_TIMEOUT_MS = 3000`, while the simulated processor in `app/server/api.ts:185` takes `4000` ms when `total > 100`. The server keeps processing after the client aborts, and the abort is shown as a generic failure. Possible fixes: no client timeout shorter than the processor's, an idempotency key, and/or polling the order status on timeout instead of declaring a failure. *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-02 — API accepts several coupons per order (stacking), down to a negative total

- **Source:** found by me
- **Type:** Logic / Security
- **Severity:** Critical. Anyone can get arbitrary discounts, including a total below $0 (the shop would "owe" the customer), by calling the documented API.
- **Priority:** P1. Direct revenue loss, and trivial to exploit (the API doc itself shows `coupons` as an array).
- **Preconditions:** logged in (`sid` cookie).
- **Steps to reproduce:**
  1. `POST /api/checkout` with `{"items":[{"productId":1,"quantity":2}],"coupons":["FLOCK10","BIENVENIDA15","FLOCK10"], SHIP}`
  2. `POST /api/checkout` with the same items and `"coupons"` = `"FLOCK10"` repeated 11 times.
- **Expected result:** the spec allows **one coupon per purchase**. The request is rejected with `400` (or only one coupon is applied), and the same coupon can never count twice (S2). A total can never be negative (S4).
- **Actual result:**
  1. `201`, subtotal 16.70, discount **5.85** (10 % + 15 % + 10 %), total 10.85.
  2. `201`, subtotal 16.70, discount **18.37**, total **-1.67**. The order is created and a payment of -$1.67 is recorded as `approved`.
- **Evidence:** curl responses above (order ids 5 and 6 on a fresh dataset).
- **Automated test:** `tests/api/coupons.spec.ts`: `[BUG-02] checkout does not stack two different coupons`, `[BUG-02] repeating a coupon never discounts more than once nor makes the total negative`
- **Root cause in the code:** `app/server/api.ts:174`. The loop accepts any number of codes, with no length check and no de-duplication. `cartTotals` in `app/shared/money.ts` sums every discount and doesn't clamp the total at 0. *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-03 — Checkout API doesn't validate stock or quantity: overselling, negative stock and negative totals

- **Source:** found by me
- **Type:** Logic / Data
- **Severity:** Critical. Stock goes negative (orders for products that don't exist physically), and a negative quantity produces a negative charge and *increases* stock.
- **Priority:** P1. The spec says "Users can't buy more than the available stock", and the API doc promises `409 out of stock`, which is never returned.
- **Preconditions:** logged in. Fresh data.
- **Steps to reproduce:**
  1. `POST /api/checkout` with `{"items":[{"productId":8,"quantity":5}], SHIP}` (the chair has stock 2), then `GET /api/products/8`.
  2. Reset, then `POST /api/checkout` with `{"items":[{"productId":1,"quantity":-3}], SHIP}`, then `GET /api/products/1`.
  3. Reset, then `POST /api/checkout` with `{"items":[{"productId":1,"quantity":0.5}], SHIP}`.
- **Expected result:** 1 → `409`, stock unchanged (S7). 2 and 3 → `400 invalid data`. The quantity must be an integer ≥ 1 (S10).
- **Actual result:**
  1. `201`, total $645.00, and the chair's stock becomes **-3**.
  2. `201`, subtotal/total **-$25.05**, and the mug's stock goes from 25 to **28**.
  3. `201`, total $4.17 for half a mug.
- **Evidence:** curl responses above.
- **Automated test:** `tests/api/stock.spec.ts`: `[BUG-03] checkout rejects a quantity above the available stock with 409`, `[BUG-03] checkout rejects an invalid quantity (-3 / 0 / 0.5) with 400` (3 tests)
- **Root cause in the code:** `app/server/api.ts:168`. `Number(item.quantity)` is used without validation, there is no `quantity <= product.stock` check before charging, and line 210 decrements the stock blindly. *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-04 — Any logged-in user can read any other user's order (IDOR)

- **Source:** found by me
- **Type:** Security
- **Severity:** Critical. It exposes another customer's name, shipping address, items and amounts. Order ids are sequential, so every order can be read by counting up.
- **Priority:** P1. A personal data leak.
- **Preconditions:** logged in as Ana. Order #3 belongs to Bruno.
- **Steps to reproduce:**
  1. As Ana, open `/orders/3` (or `GET /api/orders/3`).
- **Expected result:** `404` "Order not found" (S13). Ana can only see her own orders.
- **Actual result:** `200` with Bruno's order. The page shows *"Order #3 · Ship to: Bruno Diaz, 742 Evergreen St, Rosario"*, plus his items and total.
- **Evidence:** the Playwright run and curl both return the full order JSON (`userId: 2`).
- **Automated test:** UI `tests/ui/orders.spec.ts`: `[BUG-04] a user cannot open another user's order in the UI` · API `tests/api/orders.spec.ts`: `[BUG-04] the API does not return another user's order`
- **Root cause in the code:** `app/server/api.ts:123`. The lookup filters by `id` only, not by `o.userId === user.id` (the list endpoint does filter). *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-05 — Lowercase coupon code is "applied" with 0% discount

- **Source:** user report 2 ("The discount code is accepted but the price doesn't change.")
- **Type:** Logic
- **Severity:** High. The coupon looks accepted, but the customer pays full price.
- **Priority:** P1. Money (the customer is overcharged compared with what was promised), and it breaks an explicit spec rule: codes are case-insensitive.
- **Preconditions:** cart with 2 × Ceramic mug (subtotal $16.70).
- **Steps to reproduce:**
  1. Go to `/cart`, type `flock10` and click **Apply**.
- **Expected result:** the same as `FLOCK10`: 10 % off, discount -$1.67, total $15.03.
- **Actual result:** the message says *"Coupon flock10 applied (0%)."*, discount is $0.00 and total stays **$16.70**. Through the API, `POST /api/coupons/validate {"code":"flock10"}` returns `200 {"code":"flock10","percent":0}`, and a checkout with `coupons:["flock10"]` charges the full $16.70.
- **Evidence:** Playwright run and curl, as above.
- **Automated test:** UI `tests/ui/coupons.spec.ts`: `[BUG-05] a lowercase coupon code gives the same discount as the uppercase code` · API `tests/api/coupons.spec.ts`: `[BUG-05] the API validates a lowercase coupon code with its real percentage`, `[BUG-05] checkout with a lowercase coupon code applies the discount`
- **Root cause in the code:** `app/server/api.ts:20`. The code is matched case-insensitively (`key`), but the percent is looked up with the raw typed code: `COUPONS[typed] ?? 0`. It should be `COUPONS[key]`, and it should return the canonical `key` as `code`. *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-06 — Products added with "Add" from the catalog disappear on reload

- **Source:** user report 3 ("Some things disappear from my cart when I reload the page.")
- **Type:** Logic / Data
- **Severity:** High. Items are lost silently, which breaks the spec rule "the cart persists even if the user closes the browser".
- **Priority:** P1. Lost sales. The catalog's "Add" is the main way to add products.
- **Preconditions:** empty cart.
- **Steps to reproduce:**
  1. On `/`, click **Add** on *Basic T-shirt* (`quick-add-3`). The header shows **Cart (1)**.
  2. Reload the page.
- **Expected result:** the cart still holds 1 × Basic T-shirt (S8).
- **Actual result:** the header shows **Cart (0)** and the cart is empty. Products added from the detail page do survive a reload, which is why users say "*some* things disappear". Also, the next detail-page add overwrites the stored cart, so earlier quick-adds are lost there too.
- **Evidence:** Playwright run: `Cart (1)` before reload, `Cart (0)` after.
- **Automated test:** `tests/ui/cart.spec.ts`: `[BUG-06] a product added from the catalog stays in the cart after reloading`, `[BUG-06] catalog and detail-page adds are both kept after reloading`
- **Root cause in the code:** `app/web/src/pages/Catalog.tsx:24`. It calls `cart.setItems(...)` (React state only) instead of `cart.add(...)`, which also writes to `localStorage` (`persist` in `app/web/src/cart.tsx`). *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-07 — "One coupon per purchase" is bypassed in the UI after reloading the cart

- **Source:** found by me
- **Type:** Logic
- **Severity:** High. Any user can stack FLOCK10 + BIENVENIDA15 (25 % off) through the normal UI, and the checkout API accepts it (see BUG-02).
- **Priority:** P2. Revenue loss, reachable without any tools. It is P2 rather than P1 only because the server-side fix for BUG-02 also closes it.
- **Preconditions:** cart with 2 × Ceramic mug.
- **Steps to reproduce:**
  1. On `/cart`, apply `FLOCK10`.
  2. Reload the page.
  3. Apply `BIENVENIDA15`.
- **Expected result:** the message *"Only one coupon can be used per purchase."* appears, and only FLOCK10 stays applied.
- **Actual result:** both coupons are listed as applied and the total drops to **$12.52** (25 % off). No error is shown. Without the reload, the rule is enforced correctly.
- **Evidence:** Playwright run: `2 applied; total $12.52; coupon-error count 0`.
- **Automated test:** `tests/ui/coupons.spec.ts`: `[BUG-07] a second coupon is rejected after reloading the cart`
- **Root cause in the code:** `app/web/src/cart.tsx:52`. The "already applied" flag is a `useRef(false)` that isn't derived from the persisted `coupons`, so it resets on every page load. The guard should be `coupons.length > 0`. *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-08 — Cart quantity can exceed available stock (catalog "Add" and repeated detail adds)

- **Source:** found by me
- **Type:** Logic
- **Severity:** Medium. The user builds a cart that can't be fulfilled. Today checkout even accepts it (BUG-03).
- **Priority:** P2. It breaks "Users can't buy more than the available stock" (S9).
- **Preconditions:** empty cart.
- **Steps to reproduce:**
  1. On `/`, click **Add** on *Bluetooth headphones* (stock 3) 5 times.
  2. Open `/product/8` (chair, stock 2), select 2 and click **Add to cart** twice.
  3. Open `/cart`.
- **Expected result:** headphones capped at 3 and chair capped at 2, with a message saying the stock limit was reached.
- **Actual result:** the header shows **Cart (5)** after step 1, and the chair line shows quantity **4**. Only an explicit edit of the cart's quantity field caps the value.
- **Evidence:** Playwright run.
- **Automated test:** `tests/ui/stock.spec.ts`: `[BUG-08] adding from the catalog cannot exceed the available stock`, `[BUG-08] adding the same product twice from its page cannot exceed the available stock`
- **Root cause in the code:** `app/web/src/cart.tsx:27`. `mergeItem` adds quantities without `Math.min(..., product.stock)`, and neither `add` nor the catalog check the stock. *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-09 — Line totals are truncated instead of rounded: user is charged 1 cent less

- **Source:** found by me
- **Type:** Logic
- **Severity:** Medium. Totals are wrong in the cart, the order and the **charged amount**, and books won't reconcile (price × quantity ≠ line total).
- **Priority:** P2. Money correctness on common quantities. It is small per order but systematic.
- **Preconditions:** empty cart.
- **Steps to reproduce:**
  1. Add 3 × Ceramic mug ($8.35) and open `/cart` (or `POST /api/checkout` with `quantity: 3`).
- **Expected result:** line total and subtotal **$25.05** (8.35 × 3).
- **Actual result:** **$25.04** in the cart line, the subtotal and the order. The payment is recorded as 25.04. The same happens with 3 × T-shirt ($43.05 → $43.04).
- **Evidence:** Playwright `cart-line-total-1` = `$25.04`. API order `subtotal: 25.04`.
- **Automated test:** UI `tests/ui/cart.spec.ts`: `[BUG-09] line total and cart total are rounded to the cent (3 × $8.35 = $25.05)` · API `tests/api/checkout.spec.ts`: `[BUG-09] the order is charged the correctly rounded amount (3 × $8.35 = $25.05)`
- **Root cause in the code:** `app/shared/money.ts:7`. `Math.floor(price * quantity * 100) / 100`. Floating point gives `25.049999…`, and `floor` turns that into 25.04. Use `Math.round` (or integer cents). *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-10 — Order date uses the UTC day while the time uses Argentina time

- **Source:** found by me
- **Type:** Logic / UI
- **Severity:** Medium. Orders placed between 21:00 and 23:59 Argentina time show the **next** day, so the receipt is wrong.
- **Priority:** P2. It breaks the spec rule "Dates and times are shown in Argentina time" (S16) on a quarter of the day.
- **Preconditions:** logged in as Ana. Seed order #2 was created at `2026-10-15T02:30:00Z` (= Oct 14, 23:30 in Argentina).
- **Steps to reproduce:**
  1. Open `/orders/2` (or `GET /api/orders/2`, or look at the date column in `/orders`).
- **Expected result:** `10/14/2026 · 23:30`.
- **Actual result:** `10/15/2026 · 23:30`. The date and the time come from different time zones.
- **Evidence:** Playwright `order-date` = `Date: 10/15/2026 · 23:30`. API `displayDate: "10/15/2026"`, `displayTime: "23:30"`.
- **Automated test:** UI `tests/ui/orders.spec.ts`: `[BUG-10] the order date is shown in Argentina time, same as the order time` · API `tests/api/orders.spec.ts`: `[BUG-10] the API returns the order date in Argentina time`
- **Root cause in the code:** `app/server/api.ts:26`. The date is taken with `iso.slice(0, 10)` (the UTC date), while the time is formatted with `timeZone: America/Argentina/Buenos_Aires`. Format both with `Intl.DateTimeFormat` in the same zone. Side note for the PO: `MM/DD/YYYY` is ambiguous for Argentinian users, who would read `DD/MM/YYYY` (question 17 in `ANALYSIS.md`). *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-11 — Shipping form rejects accents, `ñ` and `º` with a misleading error

- **Source:** found by me
- **Type:** Logic / UI
- **Severity:** Medium. Customers whose name or address contains Spanish characters (`García`, `Muñoz`, `3º B`) cannot complete a purchase, which is common in an Argentina-based shop. The error makes them think they left a field empty.
- **Priority:** P2. It blocks checkout for a whole group of customers.
- **Preconditions:** logged in. Cart not empty.
- **Steps to reproduce:**
  1. At checkout, enter name `Ana García`, address `Av. Corrientes 1234, 3º B` and card `4242424242424242`, then click **Pay** (or call the API with the same shipping data).
- **Expected result:** the order is created (I assume any printable Unicode letter is valid. If the PO confirms ASCII-only on purpose, the bug is the misleading message and the lack of guidance).
- **Actual result:** `400` *"Please fill in the shipping details."*, even though both fields are filled in.
- **Evidence:** curl → `400 {"error":"Please fill in the shipping details."}`.
- **Automated test:** `tests/api/checkout.spec.ts`: `[BUG-11] shipping details with accents, ñ and º are accepted`
- **Root cause in the code:** `app/server/api.ts:149`. `SAFE_TEXT = /^[A-Za-z0-9 .,#/-]+$/` is ASCII only. Use `\p{L}` with the `u` flag, and give a specific error message. *Fix checked: with this change applied in a throwaway copy of `app/`, this bug's tests pass.*

## BUG-12 — Product detail limits the quantity to 10 even when more stock is available (assumption)

- **Source:** found by me
- **Type:** UI
- **Severity:** Low
- **Priority:** P3. The workaround is to edit the quantity in the cart.
- **Preconditions:** none.
- **Steps to reproduce:**
  1. Open `/product/1` (Ceramic mug, stock 25) and open the quantity selector.
- **Expected result:** *I assume the user can pick any quantity up to the available stock, because the spec only says "can't buy more than the available stock". If the PO confirms a per-add cap of 10 is intended, this is not a bug.*
- **Actual result:** the options go from 1 to 10.
- **Evidence:** Playwright: 10 `<option>`s for stock 25.
- **Automated test:** none (it depends on the PO's answer).
- **Root cause in the code:** `app/web/src/pages/ProductDetail.tsx:21` (`Math.min(product.stock, 10)`).

## BUG-13 — Declined payments are not recorded in "My payments" (assumption)

- **Source:** found by me
- **Type:** Data
- **Severity:** Low
- **Priority:** P3. The spec doesn't define it, but it matters for support (and for investigating BUG-01-style complaints).
- **Preconditions:** logged in.
- **Steps to reproduce:**
  1. `POST /api/checkout` with card `4242424242420000` → `402`.
  2. `GET /api/payments`.
- **Expected result:** *I assume (S14) every payment attempt is listed with its status, so a declined one appears as `declined`. If the PO confirms "payments" means approved charges only, this is not a bug.*
- **Actual result:** only the 2 seed payments are listed. The declined attempt leaves no trace.
- **Evidence:** curl.
- **Automated test:** none (it depends on the PO's answer).
- **Root cause in the code:** `app/server/api.ts:187` returns `402` before writing any payment record.

## BUG-14 — API category filter is case-sensitive, unlike search (assumption)

- **Source:** found by me
- **Type:** Logic
- **Severity:** Low. The UI always sends the exact category name, so this is visible only through the API.
- **Priority:** P3
- **Preconditions:** none.
- **Steps to reproduce:**
  1. `GET /api/products?q=MUG` → returns the Ceramic mug.
  2. `GET /api/products?category=home`.
- **Expected result:** *I assume filters behave consistently and case-insensitively, so step 2 returns the 3 Home products.*
- **Actual result:** `[]`.
- **Evidence:** curl.
- **Automated test:** none.
- **Root cause in the code:** `app/server/api.ts:92` (`p.category === category`).

---

### Not verifiable here (see `ANALYSIS.md`, S17–S19)
- **Confirmation email:** the order page claims *"We sent you a confirmation email."*, but nothing in this environment sends or exposes emails. It is untested, and it is a question for the PO.
- **Review of the team's existing test:** `tests/ui/cart.spec.ts` ("the cart total is calculated correctly") only checked that the total element was **visible**, never its value, so it would pass with BUG-09. It now asserts the amounts (2 × mug = `$16.70`).
