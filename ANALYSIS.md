# Spec analysis

Source: `SPEC.md`, plus `docs/API.md` and `USER_REPORTS.md` where they add to or contradict the spec.
Priority comes from risk: **P1** = money, payments or data integrity · **P2** = core flow correctness · **P3** = UX and presentation.

## Questions for the PO (prioritized)

### P1 — Money and payments

1. **What happens when a payment fails, is slow or times out?** The API says the processor "may take a few seconds". If the UI or server gives up first, should the order be created, retried or cancelled? Is a charge without an order ever acceptable, and who refunds it? *(Related to Report 1: "it says it failed, but I still got charged".)*
2. **Is checkout idempotent?** If the user double-clicks "Pay", or retries after an error, should they be charged once or twice? Should the button be disabled while the payment is in progress?
3. **Must the server enforce "one coupon per purchase"?** `POST /checkout` takes `coupons` as an **array**, but the spec allows only one. Should the API reject 2+ coupons with `400`, apply only the first one, or something else? What about the same code sent twice (`["FLOCK10","flock10"]`)?
4. **How is the discount calculated and rounded?** Is it "subtotal" before shipping and taxes (are there any)? Is it rounded per line or on the total, half-up to cents? Is there a cap, a minimum purchase, expiry dates or a usage limit per user? *(Related to Report 2: "accepted but the price doesn't change".)*
5. **Which price is charged?** Is it the price at add-to-cart time or at checkout time, if the price changes in between? I assume the server always recalculates from `productId` and never trusts client totals. Please confirm.
6. **When is stock reserved or decremented?** At add-to-cart, at checkout or after an approved payment? Is stock given back when a payment is declined? Who wins when two users buy the last unit at the same time?
7. **Should a declined payment show up in "My payments"?** What fields does a payment have (amount, status, date, masked card)? Is a payment always linked to an order?
8. **How should card data be handled?** Store or show only the last 4 digits? The spec asks only for the number: no expiry, CVV or holder name. Is that intended? Is validation just "16 digits", or also Luhn?

### P2 — Core flow

9. **Cart persistence: where and for whom?** Is it per browser (guest) or per account? Does a guest cart merge with the account cart on login? Does it follow the user to another device? Does it expire? What happens to a persisted item whose stock dropped, or which was deleted? *(Related to Report 3: "things disappear from my cart when I reload".)*
10. **"Can't buy more than the available stock": where is it enforced?** On the detail page only, or also in the cart quantity control, on add-to-cart from the list (which can be repeated) and on the server? Does stock count units already in my cart? What should the user see when the limit is reached: a disabled button, an error or a capped value?
11. **What are the quantity rules?** Minimum 1 is stated. Is the maximum the stock? Does typing 0 remove the item or is it rejected? Are negative or decimal values blocked or rounded?
12. **What happens on the login redirect at checkout?** Does the user come back to checkout with the cart and coupon intact?
13. **Does the coupon stay in the cart?** Is it kept across reloads, revalidated at checkout and removed when the cart is emptied? What does the user see for an invalid code? Are spaces trimmed?
14. **Who can see an order?** `GET /orders/:id` should return `404` (or `403`?) for another user's order. Please confirm the expected code. Is the order list sorted newest first?
15. **What are the shipping field rules?** Which fields are required, what are the min/max lengths, and is a whitespace-only value valid?

### P3 — Presentation and secondary

16. **What is the dollar format?** `$1,234.50` or `USD 1234.50`, with a thousands separator? Two decimals everywhere: line totals, discount line, order total, orders and payments?
17. **What does "Argentina time" cover?** Order dates, payment dates and email? I assume `America/Argentina/Buenos_Aires` (UTC-3, no DST) whatever the user's or server's time zone. What date format?
18. **What are the search rules?** Case-insensitive, partial match, accent-insensitive? Can search and category filter be combined? What is shown when nothing matches?
19. **What goes in the confirmation email?** Content, recipient (account email?) and timing: after the order is created, and only if the payment was approved?
20. **Is the user logged out when the session expires, and does logout clear the cart?**

## Ambiguities found

| # | Spec text | Why it's ambiguous / conflicting |
|---|---|---|
| A1 | "only one per purchase" (coupons) | The API takes `coupons: []`. The rule is described for the UI only, and nothing says the server enforces it. |
| A2 | "The discount is a percentage of the subtotal" | "Subtotal" is not defined (with shipping or taxes?). There is no rounding rule and no order of operations. |
| A3 | "Users can't buy more than the available stock" | Only stated for the detail page. Add-to-cart from the list, cart quantity edits and the API are not covered. It is also unclear whether stock is "live" or reserved. |
| A4 | "The cart persists even if the user closes the browser" | Persists where: browser storage or account? Guest vs logged-in, multi-device, expiry and stale items are not defined. |
| A5 | "On confirmation, the payment is processed and the order is created" | The order of operations and the failure handling are not defined (payment OK + order fails, timeout, decline). This is the area of Report 1. |
| A6 | "Afterwards the user receives a confirmation email" | After what: order created, or payment approved? There is no content and no failure behavior. |
| A7 | "They can also see their payments" | The fields, statuses (declined?) and link to orders are not defined. |
| A8 | "Totals are shown in dollars with two decimals" | Which amounts count as "totals" (unit price, line total, discount)? There is no format or locale. |
| A9 | "Dates and times are shown in Argentina time" | Which screens? Does the time shown depend on the browser's time zone? There is no format. |
| A10 | "minimum 1" (cart quantity) | The maximum and invalid inputs (0, negative, decimals, empty) are not defined. |
| A11 | "must log in before paying" | It's not said whether a guest can build a cart, nor what happens to it on login. |
| A12 | Checkout asks only for card number | No expiry or CVV. It's unclear whether this is a simplification of the simulator or the real requirement. |
| A13 | Search "by name" | Case, partial match and how it combines with the category filter are not defined. |

## Assumptions I make to move forward

Where an assumption turns out to be false, the related finding in `BUGS.md` is written as *"I assume X; if the PO confirms Y, this is a bug"*.

**Money and checkout**
- S1. The **server** is the source of truth: it recalculates prices, discount and total from `productId`, `quantity` and the coupon, and ignores client totals.
- S2. **One coupon per order is enforced by the API too.** Sending 2+ coupons (or the same one twice) is rejected with `400`, or at most one is applied. Stacking discounts is a bug.
- S3. Coupon codes are case-insensitive in **both** the UI and the API, and surrounding spaces are trimmed.
- S4. Discount = `round(subtotal × percent / 100, 2)` on the sum of line totals (no shipping or taxes in this app). Total = subtotal − discount, never negative.
- S5. An order exists **only if** the payment was approved, and every approved payment has exactly one order. A declined payment (`402`) creates no order and no approved charge. A "failed" message after a successful charge is a bug.
- S6. One click on "Pay" = at most one charge. The button is disabled while the request is in progress.
- S7. Stock is checked on the server at checkout (`409` if it's not enough) and decremented only for approved orders. A declined payment does not consume stock.

**Cart and catalog**
- S8. The cart persists across reloads and browser restarts **on the same browser**, with every item, quantity and coupon intact. Losing items on reload is a bug.
- S9. The stock limit applies everywhere: detail page, add-to-cart from the list (summed over repeated adds), cart quantity control and API.
- S10. Cart quantity accepts integers from 1 to stock. Removing an item is a separate action.
- S11. Line total = unit price × quantity. Order total = sum of line totals − discount.
- S12. Search is case-insensitive and matches part of the name. It combines with the category filter (AND).

**Account, orders, payments**
- S13. A user can only see their own orders and payments. Another user's order returns `404` (I accept `403` too).
- S14. "My payments" lists every payment attempt with its amount and status, and the card is masked (last 4 digits).
- S15. All amounts are shown as `$X.XX` (two decimals, `.` as decimal separator).
- S16. Dates are shown in `America/Argentina/Buenos_Aires` (UTC-3), whatever the browser's or server's time zone. An order placed at 01:00 UTC shows as 22:00 of the **previous day**.

**Not verifiable in this local environment (left as assumptions, not tested)**
- S17. Confirmation email: there is no mailbox or API to check it. I assume it's sent only after an approved payment and a created order.
- S18. Real payment processor behavior (timeouts, refunds): only the simulator's rules are testable (`…0000` declined, others approved, possible delay).
- S19. Cart persistence across devices or accounts: not in the spec, and not tested.
