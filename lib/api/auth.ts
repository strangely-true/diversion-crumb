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

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function logout() {
  void logoutApiCall().catch(() => null);
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}
