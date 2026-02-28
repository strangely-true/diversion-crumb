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
        <section className="bg-[#FFF4E6] px-6 py-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <h1 className="text-4xl font-bold">Your Cart</h1>

                {cartItems.length === 0 ? (
                    <div className="rounded-xl bg-white p-8 text-center shadow-md">
                        <p className="text-lg">Your basket is empty. Time to add something sweet!</p>
                        <Link
                            href="/products"
                            className="mt-4 inline-block bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                        >
                            Go to Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                className="bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                            >
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
