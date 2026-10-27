# BazaarDost

BazaarDost is a shopping site for everyday products, visible catalogue prices, and wholesale enquiries.

Tagline: Discover More. Shop Smart. Grow Together.

## Stack

- Next.js (App Router) and React
- TypeScript and Tailwind CSS
- Prisma with SQLite
- Email/password accounts with a hashed password and an httpOnly session cookie

The repository started without an application, so this stack is self-contained and does not need a hosted database or payment account to run locally.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `SESSION_SECRET` to a random string of at least 32 characters.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` if you want an admin account. The password is only read when the database is seeded, and it is stored as a hash.
4. Install and prepare the database:

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000.

`npm run db:setup` creates tables and, only when the product table is empty, loads a starter catalogue. Running it again does not overwrite products, categories, orders, or accounts that already exist.

## What the shop actually does

- Shoppers can search, filter, sort, and open category and product pages.
- Prices, compare-at discounts, stock, and wholesale figures come from the database. A discount badge is shown only when the compare-at price is higher than the selling price.
- Best sellers are products that have been ordered, excluding cancelled orders. The list is empty until that happens.
- Trending products are ordered by real product-page views.
- New arrivals are products added in the last 90 days.
- The cart and guest wishlist stay in the browser. A signed-in wishlist is stored on the account.
- Checkout accepts cash on delivery only. The order is saved as unpaid and stock is reserved. Card numbers are not collected, and payment is not marked successful by the checkout page.
- Shipping is ₹49, and free when the payable product total is ₹999 or more. No delivery date is promised.
- Displayed prices are the goods total. Checkout does not add a separate tax line.
- The starter coupon `WELCOME50` takes ₹50 off a subtotal of ₹499 or more. Disable it in admin if you do not want to offer it.
- Contact, wholesale, and newsletter forms are saved for the admin inbox.
- Password reset sends email only when `SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` are set.

## Admin

Sign in with the admin account and open `/admin`. From there you can edit products, categories, prices, stock, discounts, order status, enquiries, announcements, and coupons. Mark an order paid only after payment has been collected.

## Scripts

- `npm run dev` — local site
- `npm run build` — production build
- `npm test` — price, shipping, and coupon calculations
- `npm run lint` — Next.js lint
- `npm run db:setup` — create the SQLite database and seed when empty
