"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import type { Product } from "@/lib/products";

export default function ProductDetailActions({ product }: { product: Product }) {
    const [quantity, setQuantity] = useState(1);

    return (
        <>
            <div className="flex items-center gap-4 border-t border-[color:var(--border)] pt-6">
                <span className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-strong)]">
                    Quantity
                </span>
                <div className="flex items-center gap-3 rounded-full border-2 border-[color:var(--border)] bg-[color:var(--surface-1)] px-5 py-2 shadow-[var(--shadow-soft)]">
                    <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-[color:var(--surface-3)] active:scale-90"
                        aria-label="Decrease quantity"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="w-12 text-center text-lg font-bold">{quantity}</span>
                    <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-[color:var(--surface-3)] active:scale-90"
                        aria-label="Increase quantity"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            <AddToCartButton
                product={product}
                className="w-full rounded-full bg-[color:var(--accent)] px-8 py-4 text-lg font-semibold text-[color:var(--accent-contrast)] shadow-[var(--shadow-strong)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)] active:scale-95"
            />
        </>
    );
}
