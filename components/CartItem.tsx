"use client";

import type { CartItem as CartItemType } from "@/types/cart";

type CartItemProps = {
    item: CartItemType;
    onIncrease: () => void;
    onDecrease: () => void;
    onRemove: () => void;
};

export default function CartItem({
    item,
    onIncrease,
    onDecrease,
    onRemove,
}: CartItemProps) {
    return (
        <div className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)]">
            <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_auto]">
                <div>
                    <h3 className="text-xl font-bold text-[color:var(--text-primary)]">
                        {item.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-[color:var(--text-muted)]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${item.price.toFixed(2)} each
                    </p>
                    <button
                        onClick={onRemove}
                        className="mt-3 flex items-center gap-2 text-sm font-semibold text-rose-500 transition-colors hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                    </button>
                </div>

                <div className="flex items-center gap-3 rounded-full border-2 border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 shadow-sm">
                    <button
                        onClick={onDecrease}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-[color:var(--surface-3)] active:scale-90"
                        aria-label="Decrease quantity"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="w-10 text-center text-lg font-bold text-[color:var(--text-primary)]">{item.quantity}</span>
                    <button
                        onClick={onIncrease}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-[color:var(--surface-3)] active:scale-90"
                        aria-label="Increase quantity"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">Subtotal</p>
                    <p className="mt-1 text-2xl font-bold text-[color:var(--accent)]">
                        ${(item.price * item.quantity).toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}
