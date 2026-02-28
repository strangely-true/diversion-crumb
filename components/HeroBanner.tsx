import Image from "next/image";
import Link from "next/link";

export default function HeroBanner() {
    return (
        <div className="grid items-center gap-8 rounded-2xl bg-[#FCEFEF] p-8 shadow-md lg:grid-cols-2">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#555555]">
                    Freshly Baked Daily
                </p>
                <h1 className="mt-3 text-4xl font-bold leading-tight lg:text-5xl">
                    Elegant Bakes for Every Sweet Moment
                </h1>
                <p className="mt-4 max-w-xl text-[#555555]">
                    Discover handcrafted cakes, rustic breads, and buttery pastries made
                    with premium ingredients.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/products"
                        className="bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                    >
                        Order Now
                    </Link>
                    <Link
                        href="/products?category=Cakes"
                        className="rounded-lg border border-[#e4c98f] px-4 py-2 font-semibold"
                    >
                        Explore Cakes
                    </Link>
                </div>
            </div>

            <div className="relative h-[320px] overflow-hidden rounded-xl">
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
