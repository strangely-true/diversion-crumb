"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchMyOrders, type MyOrder } from "@/lib/api/orders";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    User,
    Mail,
    ShieldCheck,
    ShoppingBag,
    Clock,
    LogOut,
    ExternalLink,
} from "lucide-react";

export default function AccountPage() {
    const { user, isAdmin, logout, isLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<MyOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/auth/login");
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        let active = true;
        async function loadOrders() {
            try {
                const data = await fetchMyOrders();
                if (active) setOrders(data);
            } catch {
                if (active) setOrders([]);
            } finally {
                if (active) setOrdersLoading(false);
            }
        }
        void loadOrders();
        return () => { active = false; };
    }, []);

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? "?";

    const statusColor: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--accent)] border-t-transparent" />
            </div>
        );
    }

    return (
        <section className="relative min-h-screen px-4 py-14 sm:px-6 lg:px-8">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[color:var(--accent-strong)] opacity-5 blur-3xl" />

            <div className="relative mx-auto max-w-7xl space-y-8">

                {/* ── Page title ────────────────────────────────────────────────────── */}
                <div className="space-y-1">
                    <Badge
                        variant="outline"
                        className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] text-[11px] tracking-widest uppercase"
                    >
                        Dashboard
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight text-[color:var(--text-primary)]">
                        My Account
                    </h1>
                    <p className="text-sm text-[color:var(--text-muted)]">
                        Manage your profile and view your order history.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

                    {/* ── Left: Profile card ───────────────────────────────────────────── */}
                    <div className="space-y-4">
                        <Card className="border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] py-0 gap-0 overflow-hidden">
                            {/* Accent header strip */}
                            <div className="h-2 w-full bg-[color:var(--accent)]" />

                            <CardHeader className="px-6 pt-6 pb-0">
                                <CardTitle className="text-lg font-bold text-[color:var(--text-primary)]">
                                    Profile
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="px-6 pb-6 space-y-6">
                                {/* Avatar + name block */}
                                <div className="flex flex-col items-center gap-3 pt-2">
                                    <div className="relative">
                                        <Avatar className="h-20 w-20 border-4 border-[color:var(--accent)] shadow-lg">
                                            {user?.picture && (
                                                <AvatarImage
                                                    src={user.picture}
                                                    alt={user.name ?? user.email}
                                                    referrerPolicy="no-referrer"
                                                />
                                            )}
                                            <AvatarFallback className="bg-[color:var(--accent)] text-[color:var(--accent-contrast)] text-2xl font-bold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Online dot */}
                                        <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-[color:var(--surface-1)] bg-emerald-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-[color:var(--text-strong)]">
                                            {user?.name ?? "Customer"}
                                        </p>
                                        <p className="text-xs text-[color:var(--text-muted)]">{user?.email}</p>
                                        <div className="mt-2 flex items-center justify-center gap-1.5">
                                            <Badge className="rounded-full border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 text-[color:var(--accent-strong)] text-[11px] px-2.5 border">
                                                Crumbs & Co. Member
                                            </Badge>
                                            {isAdmin && (
                                                <Badge className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[11px] px-2.5 border-0">
                                                    Admin
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-[color:var(--border)]" />

                                {/* Info rows */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/15">
                                            <User size={13} className="text-[color:var(--accent-strong)]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Name</p>
                                            <p className="text-sm font-medium text-[color:var(--text-strong)] truncate">
                                                {user?.name ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/15">
                                            <Mail size={13} className="text-[color:var(--accent-strong)]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Email</p>
                                            <p className="text-sm font-medium text-[color:var(--text-strong)] truncate">
                                                {user?.email ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/15">
                                            <ShieldCheck size={13} className="text-[color:var(--accent-strong)]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">Account Type</p>
                                            <p className="text-sm font-medium text-[color:var(--text-strong)]">
                                                {isAdmin ? "Administrator" : "Customer"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-[color:var(--border)]" />

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full justify-start rounded-xl border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-strong)] hover:bg-[color:var(--surface-3)] gap-2"
                                    >
                                        <Link href="/products">
                                            <ShoppingBag size={14} />
                                            Browse Products
                                            <ExternalLink size={12} className="ml-auto text-[color:var(--text-muted)]" />
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={logout}
                                        className="w-full justify-start rounded-xl border-red-200 bg-transparent text-red-600 dark:border-red-900/50 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2"
                                    >
                                        <LogOut size={14} />
                                        Sign Out
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right: Order history ─────────────────────────────────────────── */}
                    <Card className="border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] py-0 gap-0 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[color:var(--border)]">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--accent)]/15">
                                    <Clock size={15} className="text-[color:var(--accent-strong)]" />
                                </div>
                                <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Order History</h2>
                            </div>
                            <Badge
                                variant="outline"
                                className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-muted)] text-xs px-3"
                            >
                                {orders.length} {orders.length === 1 ? "order" : "orders"}
                            </Badge>
                        </div>

                        <CardContent className="p-6">
                            {ordersLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-16 animate-pulse rounded-2xl bg-[color:var(--surface-2)]" />
                                    ))}
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center gap-4 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--surface-2)]">
                                        <ShoppingBag size={24} className="text-[color:var(--text-muted)]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[color:var(--text-strong)]">No orders yet</p>
                                        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                                            Your order history will appear here.
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        className="rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-strong)] font-semibold"
                                    >
                                        <Link href="/products">Start Shopping</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
                                                    <ShoppingBag size={16} className="text-[color:var(--accent-strong)]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[color:var(--text-primary)] text-sm">
                                                        {order.orderNumber}
                                                    </p>
                                                    <p className="text-xs text-[color:var(--text-muted)]">
                                                        {new Date(order.placedAt).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 sm:text-right">
                                                <p className="text-base font-bold text-[color:var(--text-strong)]">
                                                    ${Number(order.total).toFixed(2)}
                                                </p>
                                                <Badge
                                                    className={`rounded-full border-0 text-xs px-2.5 ${statusColor[order.status] ?? "bg-[color:var(--surface-3)] text-[color:var(--text-muted)]"}`}
                                                >
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
