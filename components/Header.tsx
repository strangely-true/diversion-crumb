"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, ShoppingBag, Sun, User, LogOut, LayoutDashboard, ChevronDown, Shield, ClipboardList, Info, Menu, X, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAgent } from "@/context/AgentContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ThemeMode = "light" | "dark";

export default function Header() {
    const { totalItems, toastMessage } = useCart();
    const { user, isAdmin, isAuthenticated, logout, login } = useAuth();
    const { isSidebarOpen } = useAgent();
    const [theme, setTheme] = useState<ThemeMode>("light");
    const [mobileOpen, setMobileOpen] = useState(false);
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
            document.documentElement.classList.toggle("dark", nextTheme === "dark");
            return nextTheme;
        });
    };

    const ThemeIcon = useMemo(() => (theme === "light" ? Moon : Sun), [theme]);

    // Initials fallback for avatar
    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? "?";

    const navLinks: { href: string; label: string; icon?: LucideIcon }[] = [
        { href: "/", label: "Home" },
        { href: "/products", label: "Products" },
        { href: "/about", label: "About Us" },
        ...(isAuthenticated ? [{ href: "/account", label: "My Orders"}] : []),
        ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
    ];

    // Close mobile menu whenever route changes
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    return (
        <header className={`fixed top-0 left-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface-1)]/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md transition-[right] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSidebarOpen ? "right-[22rem]" : "right-0"
            }`}>
            <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-3">

                {/* ── Logo ──────────────────────────────────────────────────────── */}
                <Link href="/" className="flex shrink-0 items-center gap-2">
                    {/* Icon-only on xs, full logo from sm */}
                    <Image
                        src="/images/crumbs-and-co-logo.svg"
                        alt="Crumbs & Co. logo"
                        width={180}
                        height={48}
                        className="logo-mark hidden sm:block"
                        priority
                    />
                    {/* Small icon placeholder on xs — just show abbreviated brand name */}
                    <span className="sm:hidden text-sm font-bold text-[color:var(--text-primary)] tracking-tight">
                        Crumbs
                    </span>
                </Link>

                {/* ── Nav links (pill) ──────────────────────────────────────────── */}
                <nav className="mx-auto hidden items-center gap-0.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1 text-[0.8rem] font-semibold text-[color:var(--text-strong)] shadow-[var(--shadow-soft)] sm:flex">
                    {navLinks.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-all whitespace-nowrap ${isActive
                                    ? "bg-[color:var(--surface-1)] text-[color:var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                                    : "hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
                                    }`}
                            >
                                {Icon && <Icon size={11} />}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Actions ───────────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 justify-self-end">

                    {/* Hamburger — mobile only */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setMobileOpen((o) => !o)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                        className="sm:hidden rounded-full border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-strong)] hover:bg-[color:var(--surface-3)]"
                    >
                        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                    </Button>

                    {/* Cart */}
                    <Button
                        asChild
                        variant="outline"
                        className="relative rounded-full border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-strong)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-3)] gap-1 px-3 py-1.5 h-auto text-[0.8rem] font-semibold"
                    >
                        <Link href="/cart">
                            <ShoppingBag size={14} />
                            <span className="hidden sm:inline">Cart</span>
                            {totalItems > 0 && (
                                <span
                                    suppressHydrationWarning
                                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[11px] font-bold text-[color:var(--accent-contrast)]"
                                >
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </Button>

                    {/* Theme toggle */}
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle color theme"
                        className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-strong)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-3)]"
                    >
                        <ThemeIcon size={16} />
                    </Button>

                    {/* Auth — unauthenticated */}
                    {!isAuthenticated ? (
                        <Button
                            type="button"
                            onClick={login}
                            className="hidden sm:inline-flex rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-strong)] font-semibold shadow-sm"
                        >
                            Sign In
                        </Button>
                    ) : (
                        /* Auth — authenticated: avatar dropdown */
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] py-1 pl-1 pr-3 text-sm font-medium text-[color:var(--text-strong)] shadow-sm transition-all hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
                                >
                                    <Avatar className="h-7 w-7 border border-[color:var(--accent)]">
                                        {user?.picture && (
                                            <AvatarImage
                                                src={user.picture}
                                                alt={user.name ?? user.email}
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                        <AvatarFallback className="bg-[color:var(--accent)] text-[color:var(--accent-contrast)] text-xs font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden sm:block max-w-[120px] truncate">
                                        {user?.name ?? user?.email}
                                    </span>
                                    <ChevronDown size={13} className="text-[color:var(--text-muted)] hidden sm:block shrink-0" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className="w-64 rounded-2xl border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-strong)] p-1"
                            >
                                {/* Profile header */}
                                <DropdownMenuLabel className="flex items-center gap-3 p-3 pb-2">
                                    <Avatar className="h-10 w-10 border-2 border-[color:var(--accent)]">
                                        {user?.picture && (
                                            <AvatarImage
                                                src={user.picture}
                                                alt={user.name ?? user.email}
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                        <AvatarFallback className="bg-[color:var(--accent)] text-[color:var(--accent-contrast)] text-sm font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[color:var(--text-strong)] truncate">
                                            {user?.name ?? "Customer"}
                                        </p>
                                        <p className="text-xs text-[color:var(--text-muted)] truncate">{user?.email}</p>
                                        {isAdmin && (
                                            <Badge className="mt-1 h-4 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] px-1.5 border-0">
                                                Admin
                                            </Badge>
                                        )}
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator className="bg-[color:var(--border)] mx-1" />

                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/account"
                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm cursor-pointer text-[color:var(--text-strong)] hover:bg-[color:var(--surface-2)]"
                                    >
                                        <User size={15} className="text-[color:var(--text-muted)]" />
                                        My Account
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/account"
                                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm cursor-pointer text-[color:var(--text-strong)] hover:bg-[color:var(--surface-2)]"
                                    >
                                        <ClipboardList size={15} className="text-[color:var(--text-muted)]" />
                                        My Orders
                                    </Link>
                                </DropdownMenuItem>

                                {isAdmin && (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/admin"
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm cursor-pointer text-[color:var(--text-strong)] hover:bg-[color:var(--surface-2)]"
                                        >
                                            <LayoutDashboard size={15} className="text-[color:var(--text-muted)]" />
                                            Admin Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator className="bg-[color:var(--border)] mx-1" />

                                <DropdownMenuItem
                                    onClick={logout}
                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30"
                                >
                                    <LogOut size={15} />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* ── Mobile menu panel ──────────────────────────────────────── */}
            <div
                className={`sm:hidden overflow-hidden border-t border-[color:var(--border)] bg-[color:var(--surface-1)] transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
                    {/* Nav links */}
                    {navLinks.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActive
                                    ? "bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)]"
                                    : "text-[color:var(--text-strong)] hover:bg-[color:var(--surface-2)]"
                                    }`}
                            >
                                {Icon && <Icon size={16} className="shrink-0" />}
                                {item.label}
                                {isActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[color:var(--accent-strong)]" />
                                )}
                            </Link>
                        );
                    })}

                    <div className="my-2 h-px bg-[color:var(--border)]" />

                    {/* Cart row */}
                    <Link
                        href="/cart"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[color:var(--text-strong)] hover:bg-[color:var(--surface-2)] transition-all"
                    >
                        <ShoppingBag size={16} className="shrink-0" />
                        Cart
                        {totalItems > 0 && (
                            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[11px] font-bold text-[color:var(--accent-contrast)]">
                                {totalItems}
                            </span>
                        )}
                    </Link>

                    {/* Auth */}
                    {!isAuthenticated ? (
                        <button
                            type="button"
                            onClick={login}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[color:var(--accent-strong)] hover:bg-[color:var(--surface-2)] transition-all"
                        >
                            <User size={16} className="shrink-0" />
                            Sign In
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={logout}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        >
                            <LogOut size={16} className="shrink-0" />
                            Sign Out
                        </button>
                    )}
                </div>
            </div>

            {/* Cart toast */}
            {toastMessage ? (
                <div className="pointer-events-none absolute right-6 top-[70px] z-50 rounded-xl bg-[color:var(--text-strong)] px-4 py-2 text-sm text-white shadow-lg">
                    {toastMessage}
                </div>
            ) : null}
        </header>
    );
}
