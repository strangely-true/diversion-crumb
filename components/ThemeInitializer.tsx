"use client";

import { useEffect } from "react";

type ThemeMode = "light" | "dark";

export default function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", storedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: ThemeMode = prefersDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  return null;
}
