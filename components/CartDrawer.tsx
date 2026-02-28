"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";

type CartDrawerProps = {
    open: boolean;
    onClose: () => void;
};

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
    const { cartItems, total } = useCart();

    return (
        <div
            className={`fixed inset-0 z-[70] transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
            aria-hidden={!open}
        >
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />

            <aside
                className={`absolute right-0 top-0 h-full w-full max-w-md bg-white p-6 shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Your Basket</h2>
                    <button onClick={onClose} aria-label="Close cart drawer">
                        <X size={20} />
                    </button>
                </div>

                {cartItems.length === 0 ? (
                    <div className="mt-10 rounded-xl bg-[#FFF4E6] p-6 text-center">
                        <p>Your basket is empty. Time to add something sweet!</p>
                        <Link
                            href="/products"
                            onClick={onClose}
                            className="mt-4 inline-block bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                        >
                            Go to Products
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 flex h-[calc(100%-90px)] flex-col justify-between">
                        <div className="space-y-3 overflow-y-auto pr-1">
                            {cartItems.map((item) => (
                                <div key={item.id} className="rounded-lg border border-[#f1e0c6] p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm">x{item.quantity}</p>
                                    </div>
                                    <p className="text-sm text-[#666666]">${item.price.toFixed(2)} each</p>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <div className="mb-3 flex items-center justify-between text-sm">
                                <span>Total</span>
                                <span className="text-lg font-bold">${total.toFixed(2)}</span>
                            </div>
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="block w-full bg-[#FFD580] text-center text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                            >
                                View Cart
                            </Link>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
