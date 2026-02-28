import Link from "next/link";
import Image from "next/image";
import HeroBanner from "@/components/HeroBanner";
import ProductCard from "@/components/ProductCard";
import { mapDbProductToProduct } from "@/lib/products";
import { ProductService } from "@/server/services/product.service";
import { listProductsQuerySchema } from "@/server/validation/product.schemas";

const categories = [
  {
    title: "Cakes",
    description: "Celebration-ready artisan cakes.",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Bread",
    description: "Slow-fermented loaves baked fresh daily.",
    image:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Pastries",
    description: "Flaky, buttery pastries for every mood.",
    image:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80&crop=entropy",
  },
];

const testimonials = [
  {
    quote:
      "Crumbs & Co. made our wedding unforgettable. The vanilla berry cake was perfect.",
    author: "Anika M.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  {
    quote:
      "The sourdough is consistently excellent. We order every week for brunch.",
    author: "Rahul P.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    quote: "Premium quality and elegant packaging. My go-to bakery for gifts.",
    author: "Nina S.",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80",
  },
];

const sectionImages = {
  "Featured Products":
    "/images/featured-products-icon.svg",
  "Shop by Category":
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
  "What Customers Say":
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80",
  "Join Our Bakery Newsletter":
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80",
};

export default async function Home() {
  const { items } = await ProductService.listProducts(
    listProductsQuerySchema.parse({ page: 1, pageSize: 4 }),
    false,
  );
  const featuredProducts = items
    .map(mapDbProductToProduct)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div>
      <section className="bg-[color:var(--bg)] px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <HeroBanner />
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--bg)_100%)] px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--border)] shadow-sm">
                <Image
                  src={sectionImages["Featured Products"]}
                  alt="Featured Products"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold text-[color:var(--text-primary)]">Featured Products</h2>
            </div>
            <Link
              href="/products"
              className="rounded-full bg-[color:var(--accent)] px-5 py-2.5 font-semibold text-[color:var(--accent-contrast)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
            >
              Shop All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--bg)] px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--border)] shadow-sm">
              <Image
                src={sectionImages["Shop by Category"]}
                alt="Shop by Category"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-[color:var(--text-primary)]">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.title}
                className="group relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[var(--shadow-strong)]"
              >
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-6">
                    <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                      {category.title}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[color:var(--text-muted)] leading-relaxed">{category.description}</p>
                  <Link
                    href={`/products?category=${category.title}`}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-[color:var(--border-strong)] bg-[color:var(--surface-2)] px-5 py-2.5 font-semibold text-[color:var(--text-strong)] transition-all hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-contrast)]"
                  >
                    Explore {category.title}
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--bg)_100%)] px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--border)] shadow-sm">
              <Image
                src={sectionImages["What Customers Say"]}
                alt="What Customers Say"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-[color:var(--text-primary)]">What Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <div
                key={item.author}
                className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-6 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-strong)]"
              >
                {/* Quote decoration */}
                <svg
                  className="absolute -right-2 -top-2 h-24 w-24 text-[color:var(--accent)] opacity-10"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M10 8.586L8.586 10 14.586 16 8.586 22 10 23.414 16 17.414z" />
                  <path d="M10 8.586L8.586 10 14.586 16 8.586 22 10 23.414 16 17.414z" transform="translate(8)" />
                </svg>

                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[color:var(--accent)] shadow-md">
                    <Image
                      src={item.image}
                      alt={item.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-[color:var(--text-primary)]">{item.author}</p>
                    <div className="mt-0.5 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-4 w-4 fill-[color:var(--accent)]" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="relative z-10 text-[color:var(--text-muted)] leading-relaxed italic">"{item.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--bg)] px-6 py-16">
        <div className="relative mx-auto max-w-screen-xl overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[linear-gradient(135deg,var(--surface-3)_0%,var(--surface-2)_55%,var(--bg)_100%)] p-10 text-center shadow-[var(--shadow-strong)]">
          {/* Decorative accents */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[color:var(--accent)] opacity-10 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-[color:var(--accent-strong)] opacity-10 blur-3xl"></div>

          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-[color:var(--accent)] shadow-md">
                <Image
                  src={sectionImages["Join Our Bakery Newsletter"]}
                  alt="Join Our Bakery Newsletter"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold text-[color:var(--text-primary)] lg:text-4xl">
                Join Our Bakery Newsletter
              </h2>
            </div>
            <p className="mt-4 text-lg text-[color:var(--text-muted)]">
              Receive seasonal menu updates, exclusive offers, and baking stories.
            </p>
            <form className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full bg-[color:var(--surface-1)] shadow-lg"
              />
              <button
                type="submit"
                className="group whitespace-nowrap rounded-full bg-[color:var(--accent)] px-6 py-3 font-semibold text-[color:var(--accent-contrast)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-strong)]"
              >
                <span className="flex items-center gap-2">
                  Subscribe
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
