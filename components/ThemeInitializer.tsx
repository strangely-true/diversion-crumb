"use client";

import { useEffect } from "react";

type ThemeMode = "light" | "dark";

export default function ThemeInitializer() {
  useEffect(() => {
    function applyTheme(nextTheme: ThemeMode) {
      document.documentElement.setAttribute("data-theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }

    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      applyTheme(storedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: ThemeMode = prefersDark ? "dark" : "light";
    applyTheme(nextTheme);
  }, []);

  return null;
}
