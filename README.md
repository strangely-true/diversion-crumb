# Crumbs & Co. — AI-Powered Bakery Demo

> A full-stack Next.js 16 bakery storefront featuring **Crumb**, a real-time AI voice & chat assistant that can browse the menu, manage your cart, handle discounts, take custom cake orders, and escalate to a human agent — all by voice or text.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Local Development Setup](#local-development-setup)
7. [Environment Variables](#environment-variables)
8. [Database Setup](#database-setup)
9. [Running the App](#running-the-app)
10. [Crumb — AI Voice & Chat Assistant](#crumb--ai-voice--chat-assistant)
11. [Admin Dashboard](#admin-dashboard)
12. [REST API Reference](#rest-api-reference)
13. [Testing](#testing)
14. [Deployment](#deployment)

---

## Overview

**Crumbs & Co.** is a production-grade reference application for an artisan bakery. It demonstrates how a modern retail storefront can be built *agentic-first*: instead of a traditional search bar and menu, customers interact with **Crumb** — a conversational AI that knows the entire product catalogue, can add items to their cart with a visual confirmation step, apply or escalate discount requests, submit custom cake orders, and hand off to a live human support agent.

The project is fully integrated — a single Next.js codebase contains the React frontend, the Next.js App Router API layer, and a typed service/controller backend backed by a PostgreSQL database (Neon serverless).

---

## Key Features

### Storefront
- **Product catalogue** — Cakes, Breads, Pastries, Cookies with images, variants, and inventory tracking
- **Shopping cart** — Persistent, backend-synced cart with a slide-out drawer
- **Checkout** — Order creation, payment processing (Stripe integration), shipment events
- **User accounts** — Auth0-powered sign-up / login, order history, profile management
- **Dark / light theme** — System-aware with manual override

### Crumb — AI Assistant
- **Voice-first** — Real-time voice calls via the [Vapi.ai](https://vapi.ai) WebRTC SDK
- **Text fallback** — Full chat UI for when voice is unavailable
- **Live transcription** — Partial speech shown in real time while speaking
- **Tool-use architecture**
  - `listProducts` / `getProduct` — searches the live database
  - `navigateTo` — pushes the customer to any page hands-free
  - `proposeCartUpdate` — shows visual product confirmation cards before touching the cart
  - `addToCart` / `updateCartItemQuantity` / `getCart` — reads and mutates the customer's cart
  - `requestSupervisorApproval` — escalates discounts > 15% via a Google Gemini AI supervisor agent
  - `submitCustomCakeOrder` — collects delivery date, description, and fires confirmation e-mails
  - `escalateToHuman` — flags the conversation and notifies the support team
  - `answerFromKnowledge` — retrieves store policies (hours, allergens, nutrition)
- **Stale-closure-safe** — All Vapi event listeners use a ref-forwarded handler to avoid React closure bugs
- **Conversation persistence** — Full `ChatMessage[]` history stored server-side with a debounced 2-second sync

### Admin Dashboard
- Real-time KPIs: Users · Products · Orders · Conversations · Payments · Shipments
- Full CRUD for Products, Inventory, Orders, and Users
- AI conversation viewer with escalation management

### Backend
- Modular service / controller architecture inside `server/`
- Zod-validated request schemas
- Centralised error handling with Prisma-aware responses
- Auth0 session middleware for all protected routes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, RSC, Server Actions) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, `shadcn/ui`, Radix UI |
| Auth | [Auth0](https://auth0.com) (`@auth0/nextjs-auth0`) |
| Database | PostgreSQL via [Neon](https://neon.tech) serverless |
| ORM | [Prisma 7](https://www.prisma.io) with `@prisma/adapter-neon` |
| AI Voice | [Vapi.ai](https://vapi.ai) WebRTC SDK (`@vapi-ai/web`) |
| AI Models | Google Gemini (`@ai-sdk/google`) via Vercel AI SDK |
| Payments | Stripe (mock checkout for demo) |
| Email | [Resend](https://resend.com) + Nodemailer |
| File Storage | [Vercel Blob](https://vercel.com/storage/blob) |
| Animations | [Rive](https://rive.app) (`@rive-app/react-webgl2`) |
| Testing | [Playwright](https://playwright.dev) (E2E) |
| Package Manager | pnpm |

---

## Project Structure

```
diversion-crumb/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/           # Auth0 callback + session endpoints
│   │   ├── cart/           # Cart CRUD
│   │   ├── orders/         # Order management
│   │   ├── payments/       # Payment processing
│   │   ├── products/       # Product catalogue API
│   │   └── vapi/
│   │       ├── conversation/   # Conversation persistence & messages
│   │       └── tools/          # Vapi webhook — server-side tool execution
│   ├── admin/              # Admin dashboard (products, orders, users, inventory, conversations)
│   ├── products/           # Product listing & detail pages
│   ├── cart/               # Cart page
│   ├── checkout/           # Checkout flow
│   └── account/            # Customer account & order history
├── components/
│   ├── AgentWidget.tsx     # Floating voice/chat assistant UI
│   ├── ai-elements/        # Persona animation, mic selector, speech input
│   └── ui/                 # shadcn/ui component library
├── context/
│   ├── AgentContext.tsx    # Vapi lifecycle, tool dispatch, message history
│   ├── AuthContext.tsx     # Auth0 session state
│   └── CartContext.tsx     # Cart state + backend sync
├── server/
│   ├── services/           # Business logic (product, cart, order, payment, admin, knowledge…)
│   ├── controllers/        # Thin HTTP wrappers over services
│   ├── validation/         # Zod schemas
│   ├── errors/             # AppError + Prisma-aware error handler
│   └── prisma/             # Neon-connected Prisma client singleton
├── lib/
│   ├── vapi.ts             # Assistant config, system prompt, all tool definitions
│   ├── auth0.ts            # Auth0 client singleton
│   ├── stripe.ts           # Stripe mock checkout
│   └── api/                # Typed fetch wrappers (client.ts, cart.ts, checkout.ts…)
├── prisma/
│   ├── schema.prisma       # Full data model
│   └── seed.ts             # Demo seed data
├── hooks/
│   ├── useProducts.ts      # SWR-powered product fetching
│   └── use-mobile.ts
├── e2e/
│   └── critical-user-journey.spec.ts   # Playwright E2E journey
└── docs/
    ├── postman/            # Postman collection + environment
    └── http/               # VS Code REST Client file
```

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm i -g pnpm`)
- A **PostgreSQL** database — [Neon free tier](https://neon.tech) works out of the box
- An **Auth0** tenant (free tier) with a Regular Web Application configured
- A **Vapi.ai** account with an assistant set up
- A **Google AI** (Gemini) API key
- *(Optional)* **Resend** account for transactional email

---

## Local Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/strangely-true/diversion-crumb.git
cd diversion-crumb

# 2. Install dependencies
pnpm install

# 3. Copy the environment template
cp .env.example .env
# Fill in all required values (see Environment Variables below)

# 4. Push the schema and seed demo data
pnpm prisma migrate deploy   # or: pnpm prisma db push (quick prototyping)
pnpm db:seed

# 5. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env` and populate every value:

```env
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://...          # Neon (or any Postgres) connection string

# ── Auth0 ─────────────────────────────────────────────────────────────────────
AUTH0_SECRET=...                       # 32-byte random secret (openssl rand -hex 32)
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<tenant>.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# ── Vapi.ai ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_VAPI_PUBLIC_KEY=...        # Vapi web SDK public key
VAPI_WEBHOOK_SECRET=...                # Optional shared secret for webhook verification

# ── Google AI (Gemini) ────────────────────────────────────────────────────────
GOOGLE_GENERATIVE_AI_API_KEY=...

# ── Email ─────────────────────────────────────────────────────────────────────
RESEND_API_KEY=...                     # Resend API key (or configure Nodemailer SMTP)
NOTIFICATION_EMAIL=team@example.com   # Bakery team inbox for order alerts
ADMIN_EMAIL=admin@example.com

# ── Vercel Blob ───────────────────────────────────────────────────────────────
BLOB_READ_WRITE_TOKEN=...

# ── App ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## Database Setup

### Schema

The Prisma schema (`prisma/schema.prisma`) covers:

| Model | Description |
|---|---|
| `User` | Customers and admins (Auth0-linked) |
| `Product` / `ProductVariant` | Catalogue with DRAFT / ACTIVE / ARCHIVED status |
| `Category` | Cakes, Breads, Pastries, Cookies |
| `Inventory` / `InventoryEvent` | Stock levels with full audit log |
| `Cart` / `CartItem` | Per-user persistent carts |
| `Order` / `OrderItem` | Full order management lifecycle |
| `Payment` | PENDING → CAPTURED → REFUNDED |
| `Shipment` | NOT_REQUIRED → SHIPPED → DELIVERED |
| `Conversation` / `Message` | AI chat history (OPEN → ESCALATED → RESOLVED) |

### Seed

```bash
pnpm db:seed
```

Creates:

| Account | Email | Password |
|---|---|---|
| Admin | `admin@bakery.demo` | `seeded-admin-password` |
| Customer | `customer@bakery.demo` | `seeded-customer-password` |

Also creates categories, products, variants, inventory records, a sample cart, and a completed order with payment and shipment events.

---

## Running the App

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js development server (HMR enabled) |
| `pnpm build` | Production build (also runs `prisma generate`) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:seed` | Seed the database with demo data |

---

## Crumb — AI Voice & Chat Assistant

Crumb is the centrepiece of this demo. It floats in the bottom-right corner of every page as the `AgentWidget` component.

### Architecture

```
Browser (AgentWidget)
  │
  ├── Vapi WebRTC SDK ──────────────────────────────────────→ Vapi Cloud
  │     • Real-time audio transport                              │
  │     • Partial transcripts via message events              │
  │     • Client tools dispatched locally (no server round-trip)│
  │                                                             │
  └── Server tools via webhook ◄──────────────────────────── Vapi Cloud
        POST /api/vapi/tools
          listProducts, getProduct,
          addToCart, getCart, updateCartItemQuantity,
          requestSupervisorApproval, submitCustomCakeOrder,
          escalateToHuman, answerFromKnowledge
```

### Client Tools (handled in-browser)

| Tool | What it does |
|---|---|
| `navigateTo` | Pushes Next.js router to any page (hands-free navigation) |
| `proposeCartUpdate` | Renders visual product cards with Yes/No buttons before touching the cart |

### Server Tools (handled at `/api/vapi/tools`)

| Tool | What it does |
|---|---|
| `listProducts` | Searches the live product catalogue |
| `getProduct` | Fetches full details — allergens, nutrition, variants |
| `addToCart` | Adds a variant to the customer's cart |
| `updateCartItemQuantity` | Updates quantities or removes items |
| `getCart` | Returns the current cart contents |
| `requestSupervisorApproval` | Sends the discount request to a Gemini AI supervisor |
| `submitCustomCakeOrder` | Collects order details and fires transactional emails |
| `escalateToHuman` | Marks the conversation ESCALATED and queues a support notification |
| `answerFromKnowledge` | Returns store hours, allergen info, and policies |

### Discount Supervisor Flow

Discounts ≤ 15% are auto-approved by Crumb. Anything higher triggers `requestSupervisorApproval`, which calls the Google Gemini model with the full context. The supervisor response is fed back into the voice call in real time.

### Custom Cake Order Flow

1. Crumb collects: delivery date, flavour, size, number of tiers, design notes, dietary requirements
2. `submitCustomCakeOrder` is called — customer email is resolved from Auth0 session automatically
3. Confirmation emails are sent to both the customer and the bakery team via Resend

---

## Admin Dashboard

Accessible at `/admin` (requires ADMIN role).

| Section | Capabilities |
|---|---|
| Dashboard | KPI cards — Users, Products, Orders, Conversations, Payments, Shipments |
| Products | Create / edit / archive products, upload images to Vercel Blob |
| Inventory | View stock levels, create adjustments |
| Orders | View all orders, update order status |
| Users | Browse user accounts, view roles |
| Conversations | Review AI chat transcripts, manage escalations |
| Agent Config | Inspect and tune the active Vapi assistant settings |

---

## REST API Reference

All endpoints live under `/api`. Auth is handled via the Auth0 session cookie.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List products (filter by category, status, search) |
| `GET` | `/api/products/:id` | Get product by ID |
| `POST` | `/api/products` | Create product (ADMIN) |
| `PATCH` | `/api/products/:id` | Update product (ADMIN) |
| `GET` | `/api/cart` | Get current user's cart |
| `POST` | `/api/cart` | Add item to cart |
| `PATCH` | `/api/cart/:itemId` | Update cart item quantity |
| `DELETE` | `/api/cart/:itemId` | Remove cart item |
| `POST` | `/api/orders` | Create order from cart |
| `GET` | `/api/orders` | List orders (scoped to user, or all for ADMIN) |
| `GET` | `/api/orders/:id` | Get order details |
| `POST` | `/api/payments` | Create payment for an order |
| `POST` | `/api/vapi/tools` | Vapi webhook — server tool execution |
| `POST` | `/api/vapi/conversation` | Create / resume AI conversation session |
| `GET/POST` | `/api/vapi/conversation/messages` | Fetch or persist conversation messages |

Quick testing:

- **Postman**: import `docs/postman/bakery-api.postman_collection.json` + `docs/postman/bakery-api.postman_environment.json`
- **VS Code REST Client**: open `docs/http/bakery-api.http`

---

## Testing

### E2E — Critical User Journey

The Playwright suite covers the full happy path: sign up → browse products → add to cart → checkout → payment → order confirmation.

```bash
# Install browser binaries (once)
pnpm exec playwright install --with-deps chromium

# Run headlessly
pnpm test:e2e

# Run with interactive Playwright UI
pnpm test:e2e:ui
```

Test results are written to `test-results/`.

---

## Deployment

### Vercel (recommended)

1. Push to GitHub and import the repo in [Vercel](https://vercel.com/new).
2. Add all environment variables from the [Environment Variables](#environment-variables) section.
3. Vercel runs `pnpm build` → `prisma generate && next build` automatically.
4. Set `NEXT_PUBLIC_API_BASE_URL` and `CORS_ALLOWED_ORIGINS` to your production domain.

### Other Platforms

Any platform that supports Node.js 20+ and can run `pnpm build && pnpm start` will work. Ensure `DATABASE_URL` points to a reachable PostgreSQL instance and all secrets are injected as environment variables.
