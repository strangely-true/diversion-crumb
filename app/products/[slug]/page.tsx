import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import ProductDetailActions from "./ProductDetailActions";
import { ProductService } from "@/server/services/product.service";
import { listProductsQuerySchema } from "@/server/validation/product.schemas";
import { mapDbProductToProduct, type Product } from "@/lib/products";
import { AppError } from "@/server/errors/app-error";

type PageProps = {
    params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
    const { slug } = await params;

    let rawProduct: Awaited<ReturnType<typeof ProductService.getProductBySlug>>;
    try {
        rawProduct = await ProductService.getProductBySlug(slug);
    } catch (err) {
        if (err instanceof AppError && err.statusCode === 404) {
            return (
                <section className="bg-[color:var(--surface-2)] px-6 py-12">
                    <div className="mx-auto max-w-screen-xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-8 text-center shadow-[var(--shadow-soft)]">
                        <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">
                            Product not found
                        </h1>
                        <p className="mt-3 text-[color:var(--text-muted)]">
                            The product you requested could not be found.
                        </p>
                    </div>
                </section>
            );
        }
        throw err;
    }

    const product = mapDbProductToProduct(rawProduct);
    if (!product) {
        return (
            <section className="bg-[color:var(--surface-2)] px-6 py-12">
                <div className="mx-auto max-w-screen-xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-8 text-center shadow-[var(--shadow-soft)]">
                    <h1 className="text-3xl font-bold text-[color:var(--text-primary)]">Product unavailable</h1>
                    <p className="mt-3 text-[color:var(--text-muted)]">This product has no active variants.</p>
                </div>
            </section>
        );
    }

    const relatedRaw = (
        await ProductService.listProducts(
            listProductsQuerySchema.parse({
                page: 1,
                pageSize: 5,
                categorySlug: rawProduct.category?.slug ?? undefined,
            }),
            false,
        )
    ).items
        .filter((p) => p.slug !== slug)
        .slice(0, 4);

    const related = relatedRaw
        .map(mapDbProductToProduct)
        .filter((p): p is Product => p !== null);

    return (
        <div>
            <section className="relative bg-[color:var(--surface-2)] px-6 py-16">
                {/* Decorative blobs */}
                <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />

                <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-start">
                    <div className="group relative overflow-hidden rounded-3xl shadow-[var(--shadow-strong)] transition-shadow duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
                        {/* Corner accent */}
                        <div className="absolute right-0 top-0 z-10 h-16 w-16">
                            <svg viewBox="0 0 100 100" className="h-full w-full">
                                <path
                                    d="M 100 0 L 100 100 L 0 0 Z"
                                    fill="url(#cornerGradient)"
                                    opacity="0.15"
                                />
                                <defs>
                                    <linearGradient id="cornerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: "var(--accent)", stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        <div className="relative h-[520px] overflow-hidden">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>
                    </div>

                    <div className="space-y-6 lg:sticky lg:top-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-3)] px-4 py-1.5 text-sm font-semibold text-[color:var(--text-strong)] shadow-[var(--shadow-soft)]">
                            <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                            {product.category}
                        </div>
                        <h1 className="text-5xl font-bold leading-tight text-[color:var(--text-primary)]">
                            {product.name}
                        </h1>
                        <p className="text-lg leading-relaxed text-[color:var(--text-muted)]">{product.description}</p>
                        <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-bold text-[color:var(--text-primary)]">
                                ${product.price.toFixed(2)}
                            </p>
                            <span className="text-sm text-[color:var(--text-muted)]">per item</span>
                        </div>

                        <ProductDetailActions product={product} />
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="relative bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--bg)_100%)] px-6 py-16">
                    <div className="relative mx-auto max-w-7xl space-y-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    You might also like
                                </div>
                                <h2 className="text-4xl font-bold text-[color:var(--text-primary)]">
                                    Related Products
                                </h2>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {related.map((item) => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
