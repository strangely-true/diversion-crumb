"use client";

import { Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  const attrTheme = document.documentElement.getAttribute("data-theme");
  if (attrTheme === "light" || attrTheme === "dark") {
    return attrTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function AdminThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  const Icon = useMemo(() => (theme === "light" ? Moon : Sun), [theme]);

  function toggleTheme() {
    setTheme((current) => {
      const next: ThemeMode = current === "light" ? "dark" : "light";
      window.localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle admin theme"
      title="Toggle theme"
      className="size-8"
    >
      <Icon />
    </Button>
  );
}