"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/products";

type AddToCartButtonProps = {
    product: Product;
    className?: string;
};

export default function AddToCartButton({
    product,
    className = "",
}: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!added) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setAdded(false);
            setLoading(false);
        }, 1500);

        return () => window.clearTimeout(timeoutId);
    }, [added]);

    const baseClasses =
        "relative w-full overflow-hidden font-semibold rounded-xl px-4 py-2.5 active:scale-95 transition-all duration-300 ease-in-out";
    const stateClasses = added
        ? "bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
        : "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] hover:-translate-y-0.5";
    const disabledClasses = loading ? "opacity-70 cursor-not-allowed" : "";

    return (
        <button
            type="button"
            disabled={loading}
            onClick={() => {
                if (loading) {
                    return;
                }

                setLoading(true);
                addToCart({ id: product.id, name: product.name, price: product.price });
                setAdded(true);
            }
            }
            className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
                {added ? (
                    <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Added
                    </>
                ) : (
                    "Add to Cart"
                )}
            </span>
            {!added && (
                <span className="absolute inset-0 -z-0 bg-[color:var(--accent-strong)] opacity-0 transition-opacity duration-300 hover:opacity-100"></span>
            )}
        </button>
    );
}
