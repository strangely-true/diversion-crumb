import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import ProductDetailActions from "./ProductDetailActions";
import { ProductService } from "@/server/services/product.service";
import { listProductsQuerySchema } from "@/server/validation/product.schemas";
import { mapDbProductToProduct, type Product } from "@/lib/products";
import { AppError } from "@/server/errors/app-error";

// ISR — revalidate every 5 minutes; mutations call revalidateTag("products")
export const revalidate = 300;

type PageProps = {
    params: Promise<{ slug: string }>;
};

// Pre-render every active product page at build time
export async function generateStaticParams() {
    const slugs: string[] = [];
    let page = 1;
    const pageSize = 50; // schema maximum

    while (true) {
        const { items, totalPages } = await ProductService.listProducts(
            listProductsQuerySchema.parse({ page, pageSize }),
            false,
        );
        slugs.push(...items.map((p) => p.slug));
        if (page >= totalPages) break;
        page++;
    }

    return slugs.map((slug) => ({ slug }));
}

const ALLERGEN_META: Record<string, { label: string; emoji: string; color: string }> = {
    gluten: { label: "Gluten", emoji: "🌾", color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300" },
    dairy: { label: "Dairy", emoji: "🥛", color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300" },
    eggs: { label: "Eggs", emoji: "🥚", color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300" },
    nuts: { label: "Nuts", emoji: "🥜", color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300" },
    peanuts: { label: "Peanuts", emoji: "🥜", color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300" },
    soy: { label: "Soy", emoji: "🫘", color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300" },
    fish: { label: "Fish", emoji: "🐟", color: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300" },
    shellfish: { label: "Shellfish", emoji: "🦐", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300" },
    sesame: { label: "Sesame", emoji: "🫙", color: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300" },
    sulphites: { label: "Sulphites", emoji: "⚗️", color: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300" },
};

type NutritionFacts = {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    saturatedFat?: number;
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

            {/* ── Nutrition, Allergens & Ingredients ─────────────────────── */}
            {(rawProduct.allergens.length > 0 || rawProduct.nutritionPerServing || rawProduct.servingSize || rawProduct.ingredients) && (
                <section className="bg-[color:var(--bg)] px-6 py-14">
                    <div className="mx-auto max-w-7xl space-y-10">

                        {/* Section label */}
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent)]">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Nutritional Information
                            </div>
                            <h2 className="text-3xl font-bold text-[color:var(--text-primary)]">What&apos;s Inside</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                            {/* ── Allergens ────────────────────────────────── */}
                            {rawProduct.allergens.length > 0 && (
                                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-[var(--shadow-soft)]">
                                    <div className="mb-4 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-base">⚠️</span>
                                        <h3 className="font-bold text-[color:var(--text-primary)]">Allergen Warnings</h3>
                                    </div>
                                    <p className="mb-4 text-xs text-[color:var(--text-muted)]">
                                        This product contains or may contain the following allergens:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {rawProduct.allergens.map((allergen: string) => {
                                            const key = allergen.toLowerCase();
                                            const meta = ALLERGEN_META[key];
                                            return (
                                                <span
                                                    key={allergen}
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta?.color ?? "bg-gray-100 text-gray-800 border-gray-300"
                                                        }`}
                                                >
                                                    <span>{meta?.emoji ?? "•"}</span>
                                                    {meta?.label ?? allergen}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    {rawProduct.allergens.length === 0 && (
                                        <p className="text-sm text-[color:var(--text-muted)]">No known allergens.</p>
                                    )}
                                </div>
                            )}

                            {/* ── Nutrition Facts ──────────────────────────── */}
                            {rawProduct.nutritionPerServing && (() => {
                                const n = rawProduct.nutritionPerServing as NutritionFacts;
                                const rows: Array<[string, string, boolean]> = [
                                    ["Calories", n.calories != null ? `${n.calories} kcal` : "", true],
                                    ["Total Fat", n.fat != null ? `${n.fat}g` : "", false],
                                    ["Saturated Fat", n.saturatedFat != null ? `${n.saturatedFat}g` : "", false],
                                    ["Total Carbs", n.carbs != null ? `${n.carbs}g` : "", false],
                                    ["Sugar", n.sugar != null ? `${n.sugar}g` : "", false],
                                    ["Dietary Fiber", n.fiber != null ? `${n.fiber}g` : "", false],
                                    ["Protein", n.protein != null ? `${n.protein}g` : "", true],
                                    ["Sodium", n.sodium != null ? `${n.sodium}mg` : "", false],
                                ].filter(([, val]) => val !== "") as Array<[string, string, boolean]>;

                                return (
                                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-[var(--shadow-soft)]">
                                        <div className="mb-4 flex items-center gap-2">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-base">🥗</span>
                                            <h3 className="font-bold text-[color:var(--text-primary)]">Nutrition Facts</h3>
                                        </div>
                                        {rawProduct.servingSize && (
                                            <p className="mb-3 text-xs text-[color:var(--text-muted)]">
                                                Per serving: <span className="font-semibold text-[color:var(--text-strong)]">{rawProduct.servingSize}</span>
                                            </p>
                                        )}
                                        <div className="divide-y divide-[color:var(--border)] rounded-lg border border-[color:var(--border)] overflow-hidden">
                                            {rows.map(([label, value, highlight]) => (
                                                <div
                                                    key={label}
                                                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${highlight
                                                            ? "bg-[color:var(--surface-2)] font-semibold"
                                                            : "bg-[color:var(--surface-1)]"
                                                        }`}
                                                >
                                                    <span className="text-[color:var(--text-muted)]">{label}</span>
                                                    <span className="font-bold text-[color:var(--text-primary)]">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ── Ingredients ──────────────────────────────── */}
                            {rawProduct.ingredients && (
                                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-[var(--shadow-soft)]">
                                    <div className="mb-4 flex items-center gap-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-base">🧾</span>
                                        <h3 className="font-bold text-[color:var(--text-primary)]">Ingredients</h3>
                                    </div>
                                    <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">
                                        {rawProduct.ingredients}
                                    </p>
                                    <p className="mt-4 rounded-lg bg-[color:var(--surface-2)] px-3 py-2 text-xs text-[color:var(--text-muted)]">
                                        <span className="font-semibold text-[color:var(--text-strong)]">
                                            Made in a facility
                                        </span>{" "}
                                        that also handles nuts, dairy, eggs, and gluten-containing products.
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                </section>
            )}

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
