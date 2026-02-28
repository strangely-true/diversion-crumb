"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchMyOrders, type MyOrder } from "@/lib/api/orders";

export default function AccountPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<MyOrder[]>([]);

    useEffect(() => {
        let active = true;

        async function loadOrders() {
            try {
                const data = await fetchMyOrders();
                if (active) {
                    setOrders(data);
                }
            } catch {
                if (active) {
                    setOrders([]);
                }
            }
        }

        void loadOrders();

        return () => {
            active = false;
        };
    }, []);

    return (
        <section className="relative bg-[color:var(--surface-2)] px-6 py-16">
            {/* Decorative blobs */}
            <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />
            
            <div className="relative mx-auto max-w-7xl space-y-10">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Dashboard
                    </div>
                    <h1 className="text-5xl font-bold text-[color:var(--text-primary)]">My Account</h1>
                    <p className="mt-2 text-sm font-medium text-[color:var(--text-muted)]">
                        Manage your profile and view order history
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-8 shadow-[var(--shadow-strong)]">
                        <h2 className="mb-6 text-2xl font-bold text-[color:var(--text-primary)]">Profile</h2>
                        <div className="flex flex-col items-center gap-4 border-b border-[color:var(--border)] pb-6">
                            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[color:var(--accent)] shadow-lg">
                                <Image
                                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80"
                                    alt="Profile picture"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-[color:var(--text-primary)]">{user?.name ?? "Customer"}</p>
                                <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)]">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    SweetCrumbs Member
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <svg className="mt-0.5 h-5 w-5 text-[color:var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-[color:var(--text-strong)]">Name</p>
                                    <p className="text-[color:var(--text-muted)]">{user?.name ?? "Customer"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <svg className="mt-0.5 h-5 w-5 text-[color:var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-[color:var(--text-strong)]">Email</p>
                                    <p className="text-[color:var(--text-muted)]">{user?.email ?? "Not available"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <svg className="mt-0.5 h-5 w-5 text-[color:var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-[color:var(--text-strong)]">Address</p>
                                    <p className="text-[color:var(--text-muted)]">17 Meadow Lane, Riverdale</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-8 shadow-[var(--shadow-strong)]">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Order History</h2>
                            <span className="rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-sm font-semibold text-[color:var(--accent)]">
                                {orders.length} Orders
                            </span>
                        </div>
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="group flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)] sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
                                            <svg className="h-5 w-5 text-[color:var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-[color:var(--text-primary)]">{order.orderNumber}</p>
                                            <p className="text-xs text-[color:var(--text-muted)]">{new Date(order.placedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-lg font-bold text-[color:var(--text-primary)]">${Number(order.total).toFixed(2)}</p>
                                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {orders.length === 0 ? (
                                <p className="text-sm text-[color:var(--text-muted)]">No orders yet.</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
