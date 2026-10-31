# BazaarDost

BazaarDost is a shopping site for everyday products, visible catalogue prices, and wholesale enquiries.

Tagline: Discover More. Shop Smart. Grow Together.

## Stack

- Next.js (App Router) and React
- TypeScript and Tailwind CSS
- Prisma with PostgreSQL
- Email/password accounts with a hashed password and an httpOnly session cookie
- Amazon S3 for product and category images in production

Checkout does not use a payment provider. Orders are cash on delivery.

## Setup

1. Create an empty PostgreSQL database. Amplify Hosting cannot reach a database that is private to a VPC, so the host used in production must accept TLS connections from the internet.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to that database.
4. Set `SESSION_SECRET` to a random string of at least 32 characters.
5. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` if you want an admin account. The password is only read when the database is seeded, and it is stored as a hash.
6. Install and prepare the database:

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000.

`npm run db:setup` applies the committed PostgreSQL migration and, only when the product table is empty, loads a starter catalogue. Running it again does not overwrite products, categories, orders, or accounts that already exist.

The old SQLite file is not opened by this schema and is not copied automatically. Leave `prisma/dev.db` in place if you still want that file, then seed the empty PostgreSQL database.

Local development can leave the S3 variables unset. Admin uploads then stay under `public/uploads`, and generated catalogue art stays under `public/media`. Production refuses those disk writes and requires S3.

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
- `npm run db:migrate` — apply the committed PostgreSQL migration
- `npm run db:setup` — apply the migration and seed when the catalogue is empty

## AWS Amplify Hosting

Deploy this app as Next.js SSR (WEB_COMPUTE). Static hosting cannot serve the API routes. Do not set the build output to an `out` directory, and do not run `npm start` or `npm run db:setup` in the Amplify build.

The repository `amplify.yml` is the build spec:

- Node.js 20 (`nvm use 20`)
- Install: `npm ci` (this runs `prisma generate`)
- Build: `npx prisma migrate deploy`, then `npm run build`
- Artifacts: `.next`
- Cache: `node_modules/**/*` and `.next/cache/**/*`

Set these environment variables in the Amplify console before the first build. `NEXT_PUBLIC_SITE_URL` is inlined at build time. `npx prisma migrate deploy` connects to PostgreSQL during the build, so the database must already exist and be reachable.

Required:

- `DATABASE_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `AWS_REGION`
- `AWS_S3_BUCKET`

`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are required unless the Amplify SSR compute role is allowed to write to the bucket. `AWS_S3_PUBLIC_BASE_URL` is optional and is only for a CloudFront origin.

Optional application settings: `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM`, `NEXT_PUBLIC_SOCIAL_FACEBOOK`, `NEXT_PUBLIC_SOCIAL_YOUTUBE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`.

Create these resources yourself before deploying:

- Amazon RDS for PostgreSQL or Aurora PostgreSQL, with an empty database and TLS. Use a security group that allows port 5432 from Amplify. A private-only instance will not connect.
- An S3 bucket in `AWS_REGION`. Keep ACLs disabled. Allow public `s3:GetObject` with a bucket policy so product and category images can load in the browser. The app uploads with `s3:PutObject` and does not set an object ACL.
- An IAM user, or an Amplify SSR compute role, with `s3:PutObject` and `s3:GetObject` on that bucket.

Starter catalogue images already in `public/media` ship with the app. New admin uploads and newly generated catalogue images are stored in the bucket and saved as public HTTPS URLs. Login rate limits stay in process memory, so on Amplify they apply to each server instance separately. No payment API key is required.
