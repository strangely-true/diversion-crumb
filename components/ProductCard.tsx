"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import type { Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
    return (
        <article className="rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg">
            <Link href={`/products/${product.slug}`}>
                <div className="relative h-52 w-full overflow-hidden rounded-t-xl">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                </div>
            </Link>

            <div className="space-y-3 p-4">
                <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-[#666666]">{product.category}</p>
                </div>
                <p className="text-xl font-bold">${product.price.toFixed(2)}</p>
                <AddToCartButton product={product} />
            </div>
        </article>
    );
}
