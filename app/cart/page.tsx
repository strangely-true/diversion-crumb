"use client";

import Link from "next/link";
import CartItem from "@/components/CartItem";
import CartSummary from "@/components/CartSummary";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
    const {
        cartItems,
        subtotal,
        tax,
        shipping,
        total,
        increaseQuantity,
        decreaseQuantity,
        removeItem,
        clearCart,
    } = useCart();

    return (
        <section className="relative bg-[color:var(--surface-2)] px-6 py-16">
            {/* Decorative blob */}
            <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />
            
            <div className="relative mx-auto max-w-7xl space-y-10">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Shopping Cart
                    </div>
                    <h1 className="text-5xl font-bold text-[color:var(--text-primary)]">Your Cart</h1>
                    {cartItems.length > 0 && (
                        <p className="mt-2 text-sm font-medium text-[color:var(--text-muted)]">
                            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                        </p>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-12 text-center shadow-[var(--shadow-strong)]">
                        <svg className="mx-auto mb-4 h-16 w-16 text-[color:var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="text-xl font-medium text-[color:var(--text-primary)]">Your basket is empty</p>
                        <p className="mt-2 text-[color:var(--text-muted)]">Time to add something sweet!</p>
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
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="space-y-4 lg:col-span-2">
                            {cartItems.map((item) => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    onIncrease={() => increaseQuantity(item.id)}
                                    onDecrease={() => decreaseQuantity(item.id)}
                                    onRemove={() => removeItem(item.id)}
                                />
                            ))}

                            <button
                                onClick={clearCart}
                                className="group flex items-center gap-2 rounded-full border-2 border-[color:var(--border)] bg-[color:var(--surface-1)] px-5 py-2.5 font-semibold text-[color:var(--text-strong)] transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear Cart
                            </button>
                        </div>

                        <CartSummary
                            subtotal={subtotal}
                            tax={tax}
                            shipping={shipping}
                            total={total}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
