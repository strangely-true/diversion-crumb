import Link from "next/link";
import Image from "next/image";
import HeroBanner from "@/components/HeroBanner";
import ProductCard from "@/components/ProductCard";
import { featuredProducts } from "@/lib/products";

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
      "SweetCrumbs made our wedding unforgettable. The vanilla berry cake was perfect.",
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
    "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=500&q=80",
  "Shop by Category":
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
  "What Customers Say":
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80",
  "Join Our Bakery Newsletter":
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=500&q=80",
};

export default function Home() {
  return (
    <div>
      <section className="bg-white px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <HeroBanner />
        </div>
      </section>

      <section className="bg-[#FFF4E6] px-6 py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                <Image
                  src={sectionImages["Featured Products"]}
                  alt="Featured Products"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-3xl font-bold">Featured Products</h2>
            </div>
            <Link
              href="/products"
              className="bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
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

      <section className="bg-white px-6 py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
              <Image
                src={sectionImages["Shop by Category"]}
                alt="Shop by Category"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.title}
                className="overflow-hidden bg-[#FCEFEF] rounded-xl shadow-md transition-all duration-300 hover:shadow-lg"
              >
                <div className="relative h-44 w-full">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-semibold">{category.title}</h3>
                  <p className="mt-3 text-[#555555]">{category.description}</p>
                  <Link
                    href={`/products?category=${category.title}`}
                    className="mt-5 inline-block bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
                  >
                    Explore {category.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FFF4E6] px-6 py-12">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
              <Image
                src={sectionImages["What Customers Say"]}
                alt="What Customers Say"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold">What Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <div key={item.author} className="bg-white rounded-xl p-6 shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full">
                    <Image
                      src={item.image}
                      alt={item.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="font-semibold">{item.author}</p>
                </div>
                <p className="text-[#444444]">“{item.quote}”</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-xl bg-[#FCEFEF] p-8 text-center shadow-md">
          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
              <Image
                src={sectionImages["Join Our Bakery Newsletter"]}
                alt="Join Our Bakery Newsletter"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold">Join Our Bakery Newsletter</h2>
          </div>
          <p className="mt-3 text-[#555555]">
            Receive seasonal menu updates, exclusive offers, and baking stories.
          </p>
          <form className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="w-full bg-white"
            />
            <button
              type="submit"
              className="bg-[#FFD580] text-[#333333] font-semibold rounded-lg px-4 py-2 hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
