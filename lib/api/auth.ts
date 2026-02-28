/**
 * Client-side auth helpers.
 *
 * Authentication is fully delegated to the Auth0 SDK.
 * Login / signup / logout are handled by navigating to the SDK-mounted routes:
 *   /auth/login
 *   /auth/login?screen_hint=signup
 *   /auth/logout
 */

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "ADMIN";
};
