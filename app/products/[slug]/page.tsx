"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";

export default function ProductDetailPage() {
    const params = useParams<{ slug: string }>();
    const slug = params.slug;
    const product = getProductBySlug(slug);
    const [quantity, setQuantity] = useState(1);

    const related = useMemo(() => {
        if (!product) {
            return [];
        }
        return getRelatedProducts(product.slug, product.category);
    }, [product]);

    if (!product) {
        return (
            <section className="bg-white px-6 py-12">
                <div className="mx-auto max-w-4xl rounded-xl bg-[#FCEFEF] p-8 text-center">
                    <h1 className="text-3xl font-bold">Product not found</h1>
                    <p className="mt-3 text-[#555555]">
                        The product you requested could not be found.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <div>
            <section className="bg-white px-6 py-12">
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
                    <div className="relative h-[420px] overflow-hidden rounded-xl shadow-md">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>

                    <div className="space-y-5">
                        <p className="inline-flex rounded-full bg-[#FCEFEF] px-3 py-1 text-sm font-semibold">
                            {product.category}
                        </p>
                        <h1 className="text-4xl font-bold">{product.name}</h1>
                        <p className="text-[#555555]">{product.description}</p>
                        <p className="text-3xl font-bold">${product.price.toFixed(2)}</p>

                        <div className="flex items-center gap-4">
                            <span className="font-semibold">Quantity</span>
                            <div className="flex items-center gap-3 rounded-lg border border-[#edd9ba] px-3 py-2">
                                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button>
                                <span className="w-8 text-center">{quantity}</span>
                                <button onClick={() => setQuantity((q) => q + 1)}>+</button>
                            </div>
                        </div>

                        <AddToCartButton
                            product={product}
                            className="bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-[#FFF4E6] px-6 py-12">
                <div className="mx-auto max-w-6xl space-y-8">
                    <h2 className="text-3xl font-bold">Related Products</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {related.map((item) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
