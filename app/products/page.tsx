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
        <section className="bg-[#FFF4E6] px-6 py-12">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Bakery Products</h1>
                        <p className="mt-2 text-[#555555]">
                            Browse artisan cakes, breads, and pastries crafted with care.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ${activeCategory === category
                                            ? "bg-[#FFD580]"
                                            : "bg-white hover:bg-[#FCEFEF]"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value as SortOption)}
                            aria-label="Sort products by price"
                            className="bg-white"
                        >
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
