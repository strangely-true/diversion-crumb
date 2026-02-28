"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import type { Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
    return (
        <article className="group relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[var(--shadow-strong)]">
            {/* Decorative corner accent */}
            <div className="absolute right-0 top-0 h-20 w-20 overflow-hidden rounded-tr-2xl">
                <div className="absolute right-0 top-0 h-0 w-0 border-b-[50px] border-r-[50px] border-b-transparent border-r-[color:var(--accent)] opacity-10 transition-opacity group-hover:opacity-20"></div>
            </div>

            <Link href={`/products/${product.slug}`}>
                <div className="relative h-56 w-full overflow-hidden rounded-t-2xl bg-[color:var(--surface-2)]">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1"
                    />
                    {/* Overlay gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>
            </Link>

            <div className="relative space-y-3 p-5">
                <div>
                    <h3 className="text-lg font-semibold text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent-strong)]">
                        {product.name}
                    </h3>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--text-muted)]">
                        <span className="h-1 w-1 rounded-full bg-[color:var(--accent)]"></span>
                        {product.category}
                    </p>
                </div>
                <p className="text-2xl font-bold text-[color:var(--text-primary)]">
                    ${product.price.toFixed(2)}
                </p>
                <AddToCartButton product={product} />
            </div>
        </article>
    );
}
