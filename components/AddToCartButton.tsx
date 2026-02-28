"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";

type AddToCartButtonProps = {
    product: Product;
    className?: string;
};

export default function AddToCartButton({
    product,
    className,
}: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const [added, setAdded] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!added) return;
        const id = window.setTimeout(() => {
            setAdded(false);
            setLoading(false);
        }, 1500);
        return () => window.clearTimeout(id);
    }, [added]);

    return (
        <Button
            type="button"
            disabled={loading}
            onClick={() => {
                if (loading) return;
                setLoading(true);
                addToCart({ id: product.id, name: product.name, price: product.price });
                setAdded(true);
            }}
            className={cn(
                "w-full rounded-xl font-semibold transition-all duration-300 active:scale-[0.98]",
                added
                    ? "bg-emerald-500 hover:bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.25)]"
                    : "bg-[color:var(--accent)] hover:bg-[color:var(--accent-strong)] text-[color:var(--accent-contrast)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] hover:-translate-y-0.5",
                className,
            )}
        >
            {loading && !added ? (
                <Loader2 className="size-4 animate-spin" />
            ) : added ? (
                <><Check className="size-4" /> Added!</>
            ) : (
                <><ShoppingCart className="size-4" /> Add to Cart</>
            )}
        </Button>
    );
}
