# ShopNow — Cart and checkout

> Functional spec **as written by the PO**. It has gaps: that's how requirements arrive in real life. Spotting them is part of the exercise.

## Catalog

The user sees the product list and can search products by name and filter them by category. From the list they can add a product to the cart directly, or open its detail page.

The detail page shows the description, price and available stock. There the user picks a quantity and adds it to the cart. Users can't buy more than the available stock.

## Cart

The cart shows the added products, the quantity of each, the total per product and the order total. The user can change quantities (minimum 1) or remove products.

The cart persists even if the user closes the browser.

### Discount coupons

Discounts are applied with a code: **only one per purchase**. If a coupon is already applied, another one can't be added (the current one must be removed first). Codes are case-insensitive: `FLOCK10` and `flock10` are the same coupon.

The discount is a percentage of the subtotal.

## Checkout

If the user isn't logged in, they must log in before paying.

Checkout asks for shipping details (name and address) and the card number. On confirmation, the payment is processed and the order is created. Afterwards the user receives a confirmation email.

Totals are shown in dollars with two decimals.

## My orders and My payments

A logged-in user can see their orders with date and total, and open the detail of each one. They can also see their payments.

Dates and times are shown in Argentina time.
