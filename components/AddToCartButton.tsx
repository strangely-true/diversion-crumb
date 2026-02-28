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
        "w-full text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90 active:scale-95 transition-all duration-300 ease-in-out";
    const stateClasses = added ? "bg-green-500 text-white" : "bg-[#FFD580]";
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
            {added ? "Added ✓" : "Add to Cart"}
        </button>
    );
}
