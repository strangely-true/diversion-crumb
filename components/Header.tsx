"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, ShoppingBag, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

type ThemeMode = "light" | "dark";

export default function Header() {
    const { totalItems, toastMessage } = useCart();
    const { user, isAdmin, isAuthenticated, logout } = useAuth();
    const [theme, setTheme] = useState<ThemeMode>("light");
    const pathname = usePathname();

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
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface-1)] bg-opacity-90 shadow-[0_14px_30px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-3">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/images/crumbs-and-co-logo.svg"
                        alt="Crumbs & Co. logo"
                        width={180}
                        height={48}
                        className="logo-mark"
                        priority
                    />
                </Link>

                <nav className="mx-auto hidden items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1 text-[0.95rem] font-semibold text-[color:var(--text-strong)] shadow-[var(--shadow-soft)] sm:flex">
                    {[
                        { href: "/", label: "Home" },
                        { href: "/products", label: "Products" },
                        ...(isAuthenticated ? [{ href: "/account", label: "Account" }] : []),
                        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
                    ].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`rounded-full px-4 py-2 transition ${isActive
                                    ? "bg-[color:var(--surface-1)] text-[color:var(--text-primary)] shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                                    : "hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2 justify-self-end">
                    {!isAuthenticated ? (
                        <Link
                            href="/auth/login"
                            className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-sm font-semibold text-[color:var(--text-strong)] transition hover:border-[color:var(--border-strong)] sm:inline-flex"
                        >
                            Login
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={logout}
                            className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-sm font-semibold text-[color:var(--text-strong)] transition hover:border-[color:var(--border-strong)] sm:inline-flex"
                        >
                            Logout
                        </button>
                    )}
                    <Link
                        href="/cart"
                        className="relative inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-[0.95rem] font-semibold text-[color:var(--text-strong)] transition hover:border-[color:var(--border-strong)]"
                    >
                        <ShoppingBag size={18} />
                        <span className="hidden sm:inline">Cart</span>
                        <span
                            suppressHydrationWarning
                            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--pill)] px-1 text-xs font-semibold text-[color:var(--accent-contrast)]"
                        >
                            {totalItems}
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle color theme"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] transition hover:border-[color:var(--border-strong)]"
                    >
                        <ThemeIcon size={18} />
                    </button>
                </div>
            </div>

            {toastMessage ? (
                <div className="pointer-events-none absolute right-6 top-[70px] rounded-lg bg-[color:var(--text-strong)] px-4 py-2 text-sm text-white shadow-lg">
                    {toastMessage}
                </div>
            ) : null}

            {isAuthenticated && user?.email ? (
                <div className="pointer-events-none absolute left-6 top-[70px] rounded-lg bg-[color:var(--surface-2)] px-3 py-1 text-xs text-[color:var(--text-muted)] shadow-[var(--shadow-soft)]">
                    Signed in as {user.email}
                </div>
            ) : null}
        </header>
    );
}
