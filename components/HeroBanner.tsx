import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ArrowRight, Sparkles } from "lucide-react";

export default function HeroBanner() {
    return (
        <div className="group relative grid items-center gap-10 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,var(--surface-3)_0%,var(--surface-2)_60%,var(--bg)_100%)] px-10 py-12 shadow-[var(--shadow-strong)] lg:grid-cols-[1fr_420px]">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-72 w-72 rounded-full bg-[color:var(--accent-strong)] opacity-10 blur-3xl" />

            {/* ── Left copy ───────────────────────────────────────────────────── */}
            <div className="relative z-10 space-y-6">
                <Badge
                    variant="outline"
                    className="gap-2 rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)] shadow-sm"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--accent)] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                    </span>
                    Freshly Baked Daily
                </Badge>

                <div>
                    <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-[color:var(--text-primary)] lg:text-5xl xl:text-6xl">
                        Artisanal Bakes for
                        <br />
                        <span className="relative inline-block">
                            <span className="relative z-10">Every Sweet Moment!</span>
                            <span className="absolute bottom-1.5 left-0 h-3 w-full rounded-full bg-[color:var(--accent)] opacity-35" />
                        </span>
                    </h1>
                    <p className="mt-4 max-w-lg text-lg leading-relaxed text-[color:var(--text-muted)]">
                        Handcrafted cakes, rustic breads, and buttery pastries — made
                        fresh every morning with premium, locally sourced ingredients.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                        asChild
                        size="lg"
                        className="rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-strong)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] hover:-translate-y-0.5 transition-all font-semibold"
                    >
                        <Link href="/products">
                            <ShoppingBag className="mr-1 size-4" />
                            Order Now
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-full border-2 border-[color:var(--border-strong)] bg-transparent text-[color:var(--text-strong)] hover:border-[color:var(--accent-strong)] hover:bg-[color:var(--surface-2)] transition-all font-semibold"
                    >
                        <Link href="/products?category=Cakes">
                            Explore Cakes
                            <ArrowRight className="ml-1 size-4" />
                        </Link>
                    </Button>
                </div>

                <Separator className="bg-[color:var(--border)] opacity-60" />

                <div className="flex gap-8 text-sm">
                    {[{ "label": "Items on menu", "value": "30+" }, { "label": "Baked fresh daily", "value": "100%" }, { "label": "Happy customers", "value": "2 k+" }].map((stat) => (
                        <div key={stat.label}>
                            <p className="text-xl font-bold text-[color:var(--text-strong)]">{stat.value}</p>
                            <p className="text-xs text-[color:var(--text-muted)]">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right image ─────────────────────────────────────────────────── */}
            <div className="relative z-10 hidden lg:block">
                <div className="relative h-[400px] overflow-hidden rounded-2xl shadow-[var(--shadow-strong)] transition-transform duration-700 group-hover:scale-[1.02]">
                    <Image
                        src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80"
                        alt="Fresh artisan breads displayed in bakery"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Floating badge on image */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2.5 rounded-xl bg-white/80 px-4 py-2.5 backdrop-blur-md shadow-lg dark:bg-black/60">
                            <Sparkles className="size-4 text-[color:var(--accent-strong)] shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-[color:var(--text-strong)]">Crumb is here to help</p>
                                <p className="text-[11px] text-[color:var(--text-muted)]">Ask the AI assistant about our menu</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
