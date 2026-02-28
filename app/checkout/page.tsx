"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CartSummary from "@/components/CartSummary";
import CheckoutForm from "@/components/CheckoutForm";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
    const { subtotal, tax, shipping, total, totalItems, cartId, reloadCart } = useCart();
    const [approvedDiscountPercent, setApprovedDiscountPercent] = useState<number>(0);

    useEffect(() => {
        const loadApprovedDiscount = async () => {
            try {
                const sessionId = localStorage.getItem("bakery_agent_session");
                if (!sessionId) return;

                const res = await fetch(`/api/vapi/conversation/approved-discount?sessionId=${encodeURIComponent(sessionId)}`);
                if (!res.ok) return;

                const data = await res.json() as { approvedDiscountPercent?: number | null };
                const next = typeof data.approvedDiscountPercent === "number" ? data.approvedDiscountPercent : 0;
                if (Number.isFinite(next) && next >= 0) {
                    setApprovedDiscountPercent(next);
                }
            } catch {
                // Keep checkout functional even if approval lookup fails.
            }
        };

        void loadApprovedDiscount();
    }, []);

    const discountAmount = useMemo(
        () => Number((subtotal * (approvedDiscountPercent / 100)).toFixed(2)),
        [approvedDiscountPercent, subtotal],
    );

    const payableTotal = useMemo(
        () => Number((subtotal + tax + shipping - discountAmount).toFixed(2)),
        [discountAmount, shipping, subtotal, tax],
    );

    return (
        <section className="relative bg-[color:var(--surface-2)] px-6 py-16">
            {/* Decorative blob */}
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />

            <div className="relative mx-auto max-w-7xl space-y-10">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Step 2 of 2
                    </div>
                    <h1 className="text-5xl font-bold text-[color:var(--text-primary)]">Checkout</h1>
                    {totalItems > 0 && (
                        <p className="mt-2 text-sm font-medium text-[color:var(--text-muted)]">
                            Complete your purchase of {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </p>
                    )}
                </div>

                {/* Progress indicator */}
                {totalItems > 0 && (
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent)] text-xs font-bold text-[color:var(--accent-contrast)]">
                                ✓
                            </div>
                            <span className="text-sm font-medium text-[color:var(--text-strong)]">Cart</span>
                        </div>
                        <div className="h-0.5 w-16 bg-[color:var(--accent)]" />
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent)] text-xs font-bold text-[color:var(--accent-contrast)]">
                                2
                            </div>
                            <span className="text-sm font-medium text-[color:var(--text-strong)]">Checkout</span>
                        </div>
                        <div className="h-0.5 w-16 bg-[color:var(--border)]" />
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[color:var(--border)] bg-[color:var(--surface-1)] text-xs font-bold text-[color:var(--text-muted)]">
                                3
                            </div>
                            <span className="text-sm font-medium text-[color:var(--text-muted)]">Confirmation</span>
                        </div>
                    </div>
                )}

                {totalItems === 0 ? (
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-12 text-center shadow-[var(--shadow-strong)]">
                        <svg className="mx-auto mb-4 h-16 w-16 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xl font-medium text-[color:var(--text-primary)]">Your cart is empty</p>
                        <p className="mt-2 text-[color:var(--text-muted)]">Add items before proceeding to checkout</p>
                        <Link
                            href="/products"
                            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 font-semibold text-[color:var(--accent-contrast)] shadow-[var(--shadow-strong)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)]"
                        >
                            Browse Products
                            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                        <CheckoutForm amount={payableTotal} cartId={cartId} onCheckoutComplete={reloadCart} />
                        <CartSummary
                            subtotal={subtotal}
                            tax={tax}
                            shipping={shipping}
                            discount={discountAmount}
                            discountPercent={approvedDiscountPercent}
                            total={payableTotal}
                            ctaLabel="Back to Cart"
                            ctaHref="/cart"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
