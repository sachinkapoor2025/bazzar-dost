# BazaarDost

BazaarDost is a shopping site for everyday products, visible catalogue prices, and wholesale enquiries.

Tagline: Discover More. Shop Smart. Grow Together.

## Stack

- Next.js storefront on AWS Amplify (WEB_COMPUTE)
- AWS Lambda and API Gateway for the API in `apps/api`
- DynamoDB tables named `bazaardost-products`, `bazaardost-orders`, `bazaardost-carts`, `bazaardost-customers`, `bazaardost-events`, and `bazaardost-config`
- S3 and CloudFront for new product images
- Cognito user pool in the same stack, for the same account model as the other shops
- Email/password accounts stored in the customers table, with an httpOnly session cookie

Checkout does not use a payment provider. Orders are cash on delivery. This stack does not use the UsaRakhi, BlossomPot, or SpicyCenter tables.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `SESSION_SECRET` to a random string of at least 32 characters.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` if you want an admin account. The API creates it on startup when the email is new.
4. Install and start the API and the site:

```bash
npm install
npm run dev:all
```

Open http://localhost:3000. The API listens on http://127.0.0.1:4000 and uses an in-memory catalogue until `USE_MEMORY_DB` is turned off.

`npm run db:up` starts DynamoDB Local. `npm run db:setup` creates the empty `bazaardost-*` tables there. Point `DYNAMODB_ENDPOINT` at it and set `USE_MEMORY_DB=false` before starting the API when you want that local database.

Local admin uploads stay under `public/uploads`. Production uploads go through the Lambda API into this stack's S3 bucket and are read from its CloudFront domain.

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
- `npm run dev:api` — local Lambda-style API
- `npm run dev:all` — API and site together
- `npm run build` — production storefront build
- `npm test` — price rules and the in-memory order flow
- `npm run lint` — Next.js lint
- `npm run db:up` / `npm run db:down` — DynamoDB Local
- `npm run db:setup` — create empty local `bazaardost-*` tables

## AWS Amplify and the API stack

Deploy the storefront as Next.js SSR. The Amplify app platform must be **WEB_COMPUTE**. Static hosting (platform `WEB`) cannot serve the shop pages. Do not set the build output to an `out` directory.

The repository `amplify.yml` builds only the storefront:

- Node.js 22
- `npm ci`, then `npm run build` with `NEXT_PUBLIC_SITE_URL=https://bazaardost.com`
- Artifacts: `.next`

The app root in Amplify is the repository root. The API is not part of the Amplify build. Deploy it with SAM from `infrastructure/template.yaml` when you are ready to create the BazaarDost resources. That creates the Lambda, HTTP API, DynamoDB tables, private S3 bucket, CloudFront distribution, and Cognito user pool. It does not create a PostgreSQL database and it does not attach to another shop.

The first API request loads the starter catalogue when the products table is empty, and creates the admin account when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set on the Lambda. Later requests leave existing products and accounts in place.

Amplify environment variables for branch `main`:

- `API_URL` — CloudFormation output `ApiUrl`
- `SESSION_SECRET` — the same secret passed to the SAM stack
- `NEXT_PUBLIC_SITE_URL` = `https://bazaardost.com`
- `NEXT_PUBLIC_CDN_URL` — CloudFormation output `CloudFrontUrl`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, and `NEXT_PUBLIC_COGNITO_REGION`

Shop pages still call same-origin `/api/*`. Those routes call `API_URL`. The login cookie stays on the storefront. Cognito is created with the stack so admin access can later use the `admin` group, the same way the other shops do. Current sign-in uses the customers table.

Starter catalogue images in `public/media` ship with the site. New production uploads are stored by the Lambda in this stack's bucket.

### Custom domain

The primary URL is `https://bazaardost.com`. After this app is what serves the domain, `www.bazaardost.com` redirects there with HTTP 308. The `amplifyapp.com` hostname stays available so the shop can be checked before DNS changes. Do not change the Hostinger records until that check succeeds.

Connecting the domain is done in the Amplify console and at the DNS host. Amplify’s default domain setup redirects the apex to `www`. Change that so the apex is the site and `www` redirects to the apex.

1. In Amplify, open the app `d160fo98boktnf` → Hosting → Custom domains → Add domain.
2. Enter `bazaardost.com`.
3. If the domain is in Route 53 in the same account, let Amplify update the records. Otherwise choose manual configuration, or create a Route 53 hosted zone and set the registrar nameservers to the nameservers Amplify shows.
4. Edit the subdomain mapping before you save it. Point the empty subdomain (the apex `bazaardost.com`) at the `main` branch. Set `www` to redirect to `https://bazaardost.com`. Remove the default redirect from the apex to `www`.
5. Use the Amplify-managed certificate.
6. Open Actions → View DNS records and copy those values. The certificate CNAME and the CloudFront target are created by Amplify. Do not invent them.
7. At the DNS host, add the certificate-validation CNAME exactly as shown. Add the apex record as an ALIAS, ANAME, or flattened CNAME to the CloudFront hostname Amplify shows. If `www` is included, add its CNAME to that same target. Providers that cannot put an alias on the apex need Route 53 for `bazaardost.com`.
8. On Cloudflare, leave the records DNS-only. An orange-cloud proxy breaks the Amplify certificate check.
9. Wait until the Amplify domain status is Available. Certificate checks can take up to 48 hours and fail if the validation CNAME is added late.
10. Redeploy `main` after `NEXT_PUBLIC_SITE_URL` is `https://bazaardost.com`.

The domain is not live until public DNS returns the Amplify target and `https://bazaardost.com` serves the shop. The `amplifyapp.com` hostname is not the primary URL.
