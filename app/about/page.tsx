import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Heart, Wheat, Leaf, Star, Users, Award } from "lucide-react";
import Link from "next/link";

const values = [
    {
        icon: Heart,
        title: "Made with Love",
        description:
            "Every item is baked fresh each morning by our team of passionate bakers who treat every loaf, pastry, and cake as a work of art.",
    },
    {
        icon: Wheat,
        title: "Quality Ingredients",
        description:
            "We source only the finest locally-milled flours, free-range eggs, and seasonal fruit to ensure every bite bursts with natural flavour.",
    },
    {
        icon: Leaf,
        title: "Sustainably Sourced",
        description:
            "Our packaging is fully compostable and we partner with local farms to minimise food miles and support the community around us.",
    },
];

const stats = [
    { icon: Star, value: "4.9", label: "Average rating" },
    { icon: Users, value: "12 k+", label: "Happy customers" },
    { icon: Award, value: "8+", label: "Years baking" },
    { icon: Wheat, value: "50+", label: "Recipes daily" },
];

const team = [
    {
        name: "Sophie Laurent",
        role: "Head Pastry Chef",
        bio: "Trained in Lyon and Paris, Sophie brings classical French technique to every croissant and tart.",
        initials: "SL",
    },
    {
        name: "Marcus Webb",
        role: "Head Baker",
        bio: "Marcus's slow-ferment sourdoughs have earned a loyal following across the city since 2018.",
        initials: "MW",
    },
    {
        name: "Priya Nair",
        role: "Cake Designer",
        bio: "With a fine arts background, Priya crafts showstopping celebration cakes that taste as good as they look.",
        initials: "PN",
    },
];

export default function AboutPage() {
    return (
        <section className="relative min-h-screen px-4 py-14 sm:px-6 lg:px-8">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-[color:var(--accent)] opacity-5 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[color:var(--accent-strong)] opacity-5 blur-3xl" />

            <div className="relative mx-auto max-w-5xl space-y-20">

                {/* ── Hero ──────────────────────────────────────────────────── */}
                <div className="space-y-6 text-center">
                    <Badge
                        variant="outline"
                        className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] text-[11px] tracking-widest uppercase"
                    >
                        Our Story
                    </Badge>
                    <h1 className="text-5xl font-bold tracking-tight text-[color:var(--text-primary)] sm:text-6xl">
                        Baked with soul,{" "}
                        <span className="text-[color:var(--accent-strong)]">served with warmth</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-[color:var(--text-muted)] leading-relaxed">
                        Crumbs &amp; Co. started in a tiny kitchen in 2016 with one simple belief — that great
                        baking can brighten anyone's day. A decade on, we're still hand-crafting every item
                        with the same care, curiosity, and a generous pinch of joy.
                    </p>
                </div>

                {/* ── Stats bar ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {stats.map(({ icon: Icon, value, label }) => (
                        <Card
                            key={label}
                            className="border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] py-0 gap-0"
                        >
                            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent)]/15">
                                    <Icon size={18} className="text-[color:var(--accent-strong)]" />
                                </div>
                                <p className="text-2xl font-bold text-[color:var(--text-primary)]">{value}</p>
                                <p className="text-xs text-[color:var(--text-muted)]">{label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Our values ────────────────────────────────────────────── */}
                <div className="space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-[color:var(--text-primary)]">What we stand for</h2>
                        <p className="text-[color:var(--text-muted)]">
                            Three principles guide everything we bake and every decision we make.
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-3">
                        {values.map(({ icon: Icon, title, description }) => (
                            <Card
                                key={title}
                                className="border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 py-0 gap-0 overflow-hidden"
                            >
                                <div className="h-1 w-full bg-[color:var(--accent)]" />
                                <CardContent className="space-y-3 p-6">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/15">
                                        <Icon size={18} className="text-[color:var(--accent-strong)]" />
                                    </div>
                                    <p className="font-bold text-[color:var(--text-strong)]">{title}</p>
                                    <p className="text-sm text-[color:var(--text-muted)] leading-relaxed">{description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Separator className="bg-[color:var(--border)]" />

                {/* ── Meet the team ─────────────────────────────────────────── */}
                <div className="space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-[color:var(--text-primary)]">Meet the bakers</h2>
                        <p className="text-[color:var(--text-muted)]">The hands and hearts behind every bite.</p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-3">
                        {team.map(({ name, role, bio, initials }) => (
                            <Card
                                key={name}
                                className="border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] py-0 gap-0"
                            >
                                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)] text-xl font-bold text-[color:var(--accent-contrast)] shadow-md">
                                        {initials}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[color:var(--text-strong)]">{name}</p>
                                        <Badge
                                            variant="outline"
                                            className="mt-1 rounded-full border-[color:var(--border)] text-[color:var(--text-muted)] text-[11px]"
                                        >
                                            {role}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-[color:var(--text-muted)] leading-relaxed">{bio}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* ── CTA ───────────────────────────────────────────────────── */}
                <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-10 text-center shadow-[var(--shadow-soft)] space-y-5">
                    <p className="text-2xl font-bold text-[color:var(--text-primary)]">
                        Ready to taste the difference?
                    </p>
                    <p className="text-[color:var(--text-muted)]">
                        Browse our full range of freshly baked goods and discover your new favourite.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button
                            asChild
                            className="rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-strong)] font-semibold px-8"
                        >
                            <Link href="/products">Shop Now</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-strong)] hover:bg-[color:var(--surface-3)]"
                        >
                            <Link href="/cart">View Cart</Link>
                        </Button>
                    </div>
                </div>

            </div>
        </section>
    );
}
