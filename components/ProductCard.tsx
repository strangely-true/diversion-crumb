"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AddToCartButton from "@/components/AddToCartButton";
import type { Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
    return (
        <Card className="group relative overflow-hidden rounded-2xl border-[color:var(--border)] bg-[color:var(--surface-1)] py-0 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-strong)] gap-0">
            {/* ── Image ─────────────────────────────────────────────────────── */}
            <Link href={`/products/${product.slug}`} className="block">
                <div className="relative h-52 w-full overflow-hidden bg-[color:var(--surface-2)]">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {/* Category badge floated on image */}
                    <div className="absolute left-3 top-3">
                        <Badge className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold text-[color:var(--accent-contrast)] backdrop-blur-sm shadow-sm border-0">
                            {product.category}
                        </Badge>
                    </div>
                </div>
            </Link>

            {/* ── Body ──────────────────────────────────────────────────────── */}
            <CardContent className="px-4 pt-4 pb-2 space-y-1">
                <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-base leading-snug text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent-strong)] line-clamp-2">
                        {product.name}
                    </h3>
                </Link>
                <p className="text-2xl font-bold text-[color:var(--text-strong)] tracking-tight">
                    ${product.price.toFixed(2)}
                    <span className="ml-1 text-xs font-normal text-[color:var(--text-muted)]">/ unit</span>
                </p>
            </CardContent>

            {/* ── Footer CTA ────────────────────────────────────────────────── */}
            <CardFooter className="px-4 pb-4 pt-0">
                <AddToCartButton product={product} />
            </CardFooter>
        </Card>
    );
}
