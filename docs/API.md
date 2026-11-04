# ShopNow API

Base URL: `http://localhost:4321/api`. All requests and responses are JSON. The session is handled with the `sid` cookie returned by login.

You can test the API directly (Playwright `request`, Postman, curl, etc.). It is a legitimate part of the exercise.

## Authentication

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/login` | `{ "email", "password" }` | `200` user + `sid` cookie · `401` invalid credentials |
| POST | `/logout` | — | `200` |
| GET | `/me` | — | `200` user · `401` not logged in |

## Products

| Method | Path | Response |
|---|---|---|
| GET | `/products?q=text&category=Home` | Product list (`id`, `name`, `category`, `price`, `stock`, `description`) |
| GET | `/products/:id` | Product · `404` if it doesn't exist |

## Coupons

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/coupons/validate` | `{ "code" }` | `200` `{ "code", "percent" }` · `404` if it doesn't exist |

## Checkout (requires login)

`POST /checkout`

```json
{
  "items": [{ "productId": 3, "quantity": 2 }],
  "coupons": ["FLOCK10"],
  "shipping": { "name": "Ana Garcia", "address": "1234 Corrientes Ave" },
  "card": { "number": "4242424242424242" }
}
```

Responses: `201` order created · `400` invalid data · `401` not logged in · `402` payment declined · `409` out of stock.

The payment processor is simulated:
- any 16-digit card is approved, except cards ending in `0000`, which are declined;
- it may take a few seconds to respond.

## Orders and payments (require login)

| Method | Path | Response |
|---|---|---|
| GET | `/orders` | The user's orders |
| GET | `/orders/:id` | Order detail · `404` if it doesn't exist |
| GET | `/payments` | The user's payments |

## Testing only

| Method | Path | Response |
|---|---|---|
| POST | `/test/reset` | Restores the data to a fresh install (products, stock, sample orders and payments) |

Use it in your tests to always start from a clean state (see `tests/helpers.ts`).
