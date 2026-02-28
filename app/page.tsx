import Link from "next/link";
import Image from "next/image";
import HeroBanner from "@/components/HeroBanner";
import ProductCard from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowRight, Star, Bot, Search, ShoppingCart, Package } from "lucide-react";
import { mapDbProductToProduct } from "@/lib/products";
import { ProductService } from "@/server/services/product.service";
import { listProductsQuerySchema } from "@/server/validation/product.schemas";

// ISR — revalidate every 5 minutes; visiting the home page also warms the
// Next.js data cache so every subsequent product-page hit is instant.
export const revalidate = 300;

// ── Static data ────────────────────────────────────────────────────────────────

const categories = [
  {
    slug: "Cakes",
    title: "Cakes",
    description: "Celebration-ready artisan cakes for every occasion.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "Breads",
    title: "Breads",
    description: "Slow-fermented sourdoughs and rustic loaves baked fresh daily.",
    image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "Pastries",
    title: "Pastries",
    description: "Flaky, buttery pastries and croissants for every craving.",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80",
  },
];

const testimonials = [
  {
    quote: "Crumbs & Co. made our wedding unforgettable. The vanilla berry cake was absolutely perfect.",
    author: "Anika M.",
    role: "Wedding customer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  {
    quote: "The sourdough is consistently excellent. We order every week for Sunday brunch.",
    author: "Rahul P.",
    role: "Regular customer",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    quote: "Premium quality and elegant packaging. My absolute go-to bakery for gifts.",
    author: "Nina S.",
    role: "Gift buyer",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80",
  },
];

const agentFeatures = [
  {
    icon: Search,
    title: "Browse the menu",
    description: "Ask Rosie to list or search products by category, allergens, or price.",
  },
  {
    icon: ShoppingCart,
    title: "Add to cart",
    description: "\"Add 2 sourdough loaves to my cart\" — Rosie handles the rest.",
  },
  {
    icon: Package,
    title: "Track your order",
    description: "Get real-time order status and reorder with a single sentence.",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function Home() {
  const { items } = await ProductService.listProducts(
    listProductsQuerySchema.parse({ page: 1, pageSize: 8 }),
    false,
  );
  const featuredProducts = items
    .map(mapDbProductToProduct)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="space-y-0">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <HeroBanner />
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────────── */}
      <section className="bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--bg)_100%)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Section header */}
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] text-[11px] tracking-widest uppercase"
              >
                Fresh today
              </Badge>
              <h2 className="text-3xl font-bold text-[color:var(--text-primary)] tracking-tight">
                Featured Products
              </h2>
              <p className="text-[color:var(--text-muted)] text-sm max-w-md">
                Handpicked daily from our bakery floor — ask Rosie about any item.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="shrink-0 rounded-full border-[color:var(--border-strong)] text-[color:var(--text-strong)] hover:border-[color:var(--accent-strong)] hover:bg-[color:var(--surface-2)] hidden sm:flex"
            >
              <Link href="/products">
                Shop All <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Mobile "shop all" */}
          <div className="sm:hidden text-center">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-[color:var(--border-strong)] text-[color:var(--text-strong)]"
            >
              <Link href="/products">View All Products <ArrowRight className="size-3.5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Rosie AI callout ──────────────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,var(--surface-3)_0%,var(--surface-2)_60%,var(--bg)_100%)] px-8 py-12 shadow-[var(--shadow-soft)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[color:var(--accent)] opacity-10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[color:var(--accent-strong)] opacity-10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center gap-10 text-center lg:flex-row lg:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)] shadow-[var(--shadow-soft)]">
                <Bot className="size-10 text-[color:var(--accent-contrast)]" />
              </div>

              <div className="flex-1 space-y-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] text-[11px] tracking-widest uppercase"
                >
                  AI Voice Assistant
                </Badge>
                <h2 className="text-2xl font-bold text-[color:var(--text-primary)] lg:text-3xl">
                  Meet Rosie — your bakery guide
                </h2>
                <p className="text-[color:var(--text-muted)] max-w-xl mx-auto lg:mx-0">
                  Rosie is an AI voice assistant that browses the site with you in real-time.
                  Click the <strong className="text-[color:var(--text-strong)]">Rosie</strong> tab on the right to start a conversation.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:w-72">
                {agentFeatures.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-3 text-left shadow-sm"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/20">
                      <Icon className="size-3.5 text-[color:var(--accent-strong)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text-strong)]">{title}</p>
                      <p className="text-xs text-[color:var(--text-muted)] leading-relaxed">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop by Category ──────────────────────────────────────────────────── */}
      <section className="bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--bg)_100%)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-1">
            <Badge
              variant="outline"
              className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] text-[11px] tracking-widest uppercase"
            >
              Browse by type
            </Badge>
            <h2 className="text-3xl font-bold text-[color:var(--text-primary)] tracking-tight">
              Shop by Category
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <h3 className="text-2xl font-bold text-white drop-shadow-md">{cat.title}</h3>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[color:var(--surface-1)] px-5 py-4">
                  <p className="text-sm text-[color:var(--text-muted)] leading-snug">{cat.description}</p>
                  <ArrowRight className="ml-3 size-4 shrink-0 text-[color:var(--accent-strong)] transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-1 text-center">
            <Badge
              variant="outline"
              className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] text-[11px] tracking-widest uppercase"
            >
              Customer love
            </Badge>
            <h2 className="text-3xl font-bold text-[color:var(--text-primary)] tracking-tight">
              What Our Customers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <Card
                key={t.author}
                className="border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] py-6 gap-4"
              >
                <CardContent className="px-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-[color:var(--accent)] text-[color:var(--accent)]" />
                    ))}
                  </div>
                  <p className="text-[color:var(--text-muted)] leading-relaxed italic text-sm">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <Separator className="bg-[color:var(--border)]" />
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-[color:var(--accent)]">
                      <AvatarImage src={t.image} alt={t.author} />
                      <AvatarFallback className="bg-[color:var(--surface-2)] text-[color:var(--text-strong)] text-xs font-bold">
                        {t.author.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text-strong)]">{t.author}</p>
                      <p className="text-xs text-[color:var(--text-muted)]">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,var(--surface-3)_0%,var(--surface-2)_60%,var(--bg)_100%)] px-8 py-14 text-center shadow-[var(--shadow-strong)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[color:var(--accent)] opacity-10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-[color:var(--accent-strong)] opacity-10 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] text-[11px] tracking-widest uppercase"
                >
                  Stay in the loop
                </Badge>
                <h2 className="text-3xl font-bold text-[color:var(--text-primary)] lg:text-4xl tracking-tight">
                  Join Our Bakery Newsletter
                </h2>
                <p className="text-[color:var(--text-muted)] max-w-lg mx-auto leading-relaxed">
                  Seasonal menu drops, exclusive early-access offers, and baking stories straight to your inbox.
                </p>
              </div>

              <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="rounded-full border-[color:var(--border-strong)] bg-[color:var(--surface-1)] px-5 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus-visible:ring-[color:var(--accent)] shadow-sm flex-1"
                />
                <Button
                  type="submit"
                  className="rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:bg-[color:var(--accent-strong)] font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-strong)] hover:-translate-y-0.5 transition-all shrink-0"
                >
                  Subscribe
                  <ArrowRight className="size-3.5" />
                </Button>
              </form>

              <p className="text-xs text-[color:var(--text-muted)] opacity-70">
                No spam. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
