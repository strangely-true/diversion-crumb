"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Header() {
    const { totalItems, toastMessage } = useCart();

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[#f3e3cf] bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/images/sweetcrumbs-logo.svg"
                        alt="SweetCrumbs Bakery logo"
                        width={180}
                        height={48}
                        priority
                    />
                </Link>

                <nav className="flex items-center gap-6 text-sm font-medium">
                    <Link href="/">Home</Link>
                    <Link href="/products">Products</Link>
                    <Link href="/cart" className="relative inline-flex items-center gap-2">
                        <ShoppingBag size={18} />
                        <span>Cart</span>
                        <span
                            suppressHydrationWarning
                            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFD580] px-1 text-xs font-semibold"
                        >
                            {totalItems}
                        </span>
                    </Link>
                </nav>
            </div>

            {toastMessage ? (
                <div className="pointer-events-none absolute right-6 top-[70px] rounded-lg bg-[#333333] px-4 py-2 text-sm text-white shadow-lg">
                    {toastMessage}
                </div>
            ) : null}
        </header>
    );
}
