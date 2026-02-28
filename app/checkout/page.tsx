"use client";

import Link from "next/link";
import CartSummary from "@/components/CartSummary";
import CheckoutForm from "@/components/CheckoutForm";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
    const { subtotal, tax, shipping, total, totalItems } = useCart();

    return (
        <section className="bg-white px-6 py-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <h1 className="text-4xl font-bold">Checkout</h1>

                {totalItems === 0 ? (
                    <div className="rounded-xl bg-[#FCEFEF] p-8 text-center shadow-md">
                        <p className="text-lg">Your cart is empty. Add items before checkout.</p>
                        <Link
                            href="/products"
                            className="mt-4 inline-block bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                        >
                            Go to Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <CheckoutForm amount={total} />
                        <CartSummary
                            subtotal={subtotal}
                            tax={tax}
                            shipping={shipping}
                            total={total}
                            ctaLabel="Back to Cart"
                            ctaHref="/cart"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
