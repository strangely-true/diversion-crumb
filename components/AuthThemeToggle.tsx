"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

export default function AuthThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: ThemeMode = prefersDark ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme: ThemeMode = current === "light" ? "dark" : "light";
      window.localStorage.setItem("theme", nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      return nextTheme;
    });
  };

  const ThemeIcon = useMemo(() => (theme === "light" ? Moon : Sun), [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="fixed right-6 top-6 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-strong)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--border-strong)]"
    >
      <ThemeIcon size={18} />
    </button>
  );
}
