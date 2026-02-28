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
        <div className="bg-white shadow-md rounded-xl p-4">
            <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-[#666666]">${item.price.toFixed(2)} each</p>
                    <button
                        onClick={onRemove}
                        className="mt-2 text-sm font-semibold text-[#9f6f30] hover:opacity-80"
                    >
                        Remove
                    </button>
                </div>

                <div className="border rounded flex items-center justify-between gap-3 px-2 py-1">
                    <button onClick={onDecrease} className="rounded px-3 py-1">-</button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button onClick={onIncrease} className="rounded px-3 py-1">+</button>
                </div>
            </div>
        </div>
    );
}
