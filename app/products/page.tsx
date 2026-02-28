"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { products, type ProductCategory } from "@/lib/products";

type SortOption = "price-asc" | "price-desc";

const categories: Array<ProductCategory | "All"> = ["All", "Cakes", "Bread", "Pastries"];

export default function ProductsPage() {
    const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
    const [sortBy, setSortBy] = useState<SortOption>("price-asc");

    const visibleProducts = useMemo(() => {
        const filtered =
            activeCategory === "All"
                ? [...products]
                : products.filter((product) => product.category === activeCategory);

        filtered.sort((a, b) =>
            sortBy === "price-asc" ? a.price - b.price : b.price - a.price,
        );
        return filtered;
    }, [activeCategory, sortBy]);

    return (
        <section className="relative bg-[color:var(--surface-2)] px-6 py-16">
            {/* Decorative blob */}
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />
            
            <div className="relative mx-auto max-w-7xl space-y-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Shop All
                        </div>
                        <h1 className="text-5xl font-bold text-[color:var(--text-primary)]">
                            Bakery Products
                        </h1>
                        <p className="mt-3 text-lg text-[color:var(--text-muted)]">
                            Browse artisan cakes, breads, and pastries crafted with care.
                        </p>
                        <p className="mt-2 text-sm font-medium text-[color:var(--accent)]">
                            {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'} found
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`group relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)] ${activeCategory === category
                                        ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-[var(--shadow-strong)]"
                                        : "bg-[color:var(--surface-1)] text-[color:var(--text-strong)] hover:bg-[color:var(--surface-3)]"
                                        }`}
                                >
                                    {activeCategory === category && (
                                        <span className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                                    )}
                                    {category}
                                </button>
                            ))}
                        </div>

                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value as SortOption)}
                            aria-label="Sort products by price"
                            className="rounded-full bg-[color:var(--surface-1)] px-5 py-2.5 text-sm font-semibold text-[color:var(--text-strong)] shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-strong)]"
                        >
                            <option value="price-asc">💰 Price: Low to High</option>
                            <option value="price-desc">💎 Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
