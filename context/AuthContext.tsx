"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchMe,
  getStoredAuthUser,
  login as loginApi,
  logout as logoutApi,
  signup as signupApi,
  type AuthUser,
} from "@/lib/api/auth";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signup: (input: { email: string; password: string; confirmPassword: string; name?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [isLoading, setIsLoading] = useState(true);

  async function refreshSession() {
    setIsLoading(true);
    try {
      const response = await fetchMe();
      setUser((prev) => {
        if (!response.user.email) {
          return prev;
        }

        return {
          id: response.user.id,
          email: response.user.email,
          name: prev?.name ?? null,
          role: response.user.role,
        };
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  async function login(email: string, password: string) {
    const data = await loginApi(email, password);
    setUser(data.user);
  }

  async function signup(input: { email: string; password: string; confirmPassword: string; name?: string }) {
    const data = await signupApi(input);
    setUser(data.user);
  }

  async function logout() {
    await logoutApi();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
      signup,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, signup, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
