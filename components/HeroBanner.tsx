import Image from "next/image";
import Link from "next/link";

export default function HeroBanner() {
    return (
        <div className="group relative grid items-center gap-8 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,var(--surface-3)_0%,var(--surface-2)_55%,var(--bg)_100%)] p-10 shadow-[var(--shadow-strong)] lg:grid-cols-2">
            {/* Decorative accent blob */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[color:var(--accent)] opacity-10 blur-3xl"></div>
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-[color:var(--accent-strong)] opacity-10 blur-3xl"></div>

            <div className="relative z-10">
                <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)] shadow-[var(--shadow-soft)]">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--accent)] opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]"></span>
                    </span>
                    Freshly Baked Daily
                </p>
                <h1 className="mt-4 text-4xl font-bold leading-tight text-[color:var(--text-primary)] lg:text-5xl xl:text-6xl">
                    Elegant Bakes for Every{" "}
                    <span className="relative inline-block">
                        <span className="relative z-10">Sweet Moment!</span>
                        <span className="absolute bottom-2 left-0 h-3 w-full bg-[color:var(--accent)] opacity-30"></span>
                    </span>
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--text-muted)]">
                    Discover handcrafted cakes, rustic breads, and buttery pastries made
                    with premium ingredients.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                        href="/products"
                        className="group/btn relative overflow-hidden rounded-full bg-[color:var(--accent)] px-6 py-3 font-semibold text-[color:var(--accent-contrast)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)]"
                    >
                        <span className="relative z-10">Order Now</span>
                        <span className="absolute inset-0 -z-0 bg-[color:var(--accent-strong)] opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"></span>
                    </Link>
                    <Link
                        href="/products?category=Cakes"
                        className="rounded-full border-2 border-[color:var(--border-strong)] bg-[color:var(--surface-1)] px-6 py-3 font-semibold text-[color:var(--text-strong)] transition-all hover:border-[color:var(--accent-strong)] hover:bg-[color:var(--surface-2)]"
                    >
                        Explore Cakes
                    </Link>
                </div>
            </div>

            <div className="relative z-10 h-[380px] overflow-hidden rounded-2xl shadow-[var(--shadow-strong)] transition-transform duration-700 group-hover:scale-[1.02]">
                <Image
                    src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80"
                    alt="Fresh artisan breads displayed in bakery"
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>
    );
}
