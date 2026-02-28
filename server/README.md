# Backend Module Structure

This project now includes a modular backend layer using Next.js route handlers as controllers and service classes for business logic.

## Folder layout

- `server/prisma` → Prisma/Neon connection and client singleton.
- `server/auth` → Placeholder auth and role helpers (`CUSTOMER` / `ADMIN`).
- `server/errors` → App-level error class and centralized Prisma-aware response handling.
- `server/validation` → Zod schemas for request payload/query validation.
- `server/services` → Business logic for products, cart, orders, and payments.
- `server/controllers` → Thin HTTP controller layer for route handlers.
- `app/api` → REST API endpoints.
- `app/actions` → Server Actions that call service layer methods.

## Auth placeholder

For now, route handlers read these headers:

- `x-user-id`
- `x-user-role` (`CUSTOMER` or `ADMIN`)

Replace this with your real auth provider (NextAuth, Clerk, custom JWT, etc.) by adapting `server/auth/auth.ts`.
