import { apiRequest } from "@/lib/api/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "ADMIN";
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

const AUTH_TOKEN_STORAGE_KEY = "bakery_auth_token";
const AUTH_USER_STORAGE_KEY = "bakery_auth_user";

function persistAuth(data: LoginResponse) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
  }
}

export async function login(email: string, password: string) {
  const data = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  persistAuth(data);

  return data;
}

export async function signup(input: {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}) {
  const data = await apiRequest<LoginResponse>("/api/auth/signup", {
    method: "POST",
    body: input,
  });

  persistAuth(data);

  return data;
}

export async function fetchMe() {
  return apiRequest<{ user: { id: string; email?: string; role: "CUSTOMER" | "ADMIN" } }>("/api/auth/me");
}

export async function logoutApiCall() {
  return apiRequest<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

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
