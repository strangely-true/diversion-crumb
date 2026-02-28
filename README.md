This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Backend Seeding + API Testing

### 1) Seed the database

```bash
pnpm db:seed
```

You can also use Prisma's seed command:

```bash
pnpm prisma db seed
```

This seed creates:
- one admin user (`admin@bakery.demo`)
- one customer user (`customer@bakery.demo`)
- categories, products, variants, inventory records
- one sample cart and one sample order with payment + shipment event

Seed login passwords:
- admin: `seeded-admin-password`
- customer: `seeded-customer-password`

### 2) Test endpoints quickly

- Postman collection: `docs/postman/bakery-api.postman_collection.json`
- Postman environment: `docs/postman/bakery-api.postman_environment.json`
- VS Code REST client file: `docs/http/bakery-api.http`

Auth uses JWT bearer tokens and secure `auth_token` cookies via:
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

For Postman/REST client flows, authenticate first and include the bearer token in `Authorization: Bearer <token>`.

## Frontend + Backend Integration

### Step 1: CORS

- CORS middleware is configured in `middleware.ts` for all `/api/*` routes.
- Set allowed frontend origins using `CORS_ALLOWED_ORIGINS` in `.env`.

### Step 2: Environment Variables

- Copy `.env.example` to `.env` and fill values.
- Frontend uses `NEXT_PUBLIC_API_BASE_URL` for API calls.
- Backend uses `DATABASE_URL`, `JWT_SECRET`, and `CORS_ALLOWED_ORIGINS`.

## E2E Critical Journey Test

Install Playwright browser binaries once:

```bash
pnpm exec playwright install --with-deps chromium
```

Run the automated flow (signup → add to cart → checkout → payment → order verification):

```bash
pnpm test:e2e
```

### Step 3: API Client + Auth

- Centralized client: `lib/api/client.ts`.
- Auth login/token storage: `lib/api/auth.ts`.
- Login endpoint: `POST /api/auth/login` and profile endpoint: `GET /api/auth/me`.

### Step 4: Data Fetching + State Sync

- Products hook: `hooks/useProducts.ts`.
- Cart API integration: `lib/api/cart.ts`.
- Backend-synced cart context: `context/CartContext.tsx`.
- Checkout integration (order + payment): `lib/api/checkout.ts` and `components/CheckoutForm.tsx`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
