export type ProductCategory = "Cakes" | "Bread" | "Pastries";

export type Product = {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    category: ProductCategory;
    image: string;
    featured?: boolean;
};

export const products: Product[] = [
    {
        id: "1",
        slug: "signature-red-velvet-cake",
        name: "Signature Red Velvet Cake",
        description:
            "A rich red velvet sponge layered with whipped cream cheese frosting.",
        price: 34,
        category: "Cakes",
        image:
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
        featured: true,
    },
    {
        id: "2",
        slug: "artisan-sourdough-loaf",
        name: "Artisan Sourdough Loaf",
        description:
            "Naturally fermented sourdough with a crisp crust and soft, airy crumb.",
        price: 9,
        category: "Bread",
        image:
            "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80",
        featured: true,
    },
    {
        id: "3",
        slug: "butter-almond-croissant",
        name: "Butter Almond Croissant",
        description:
            "Flaky croissant layered with almond cream and toasted almond flakes.",
        price: 6,
        category: "Pastries",
        image:
            "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
        featured: true,
    },
    {
        id: "4",
        slug: "vanilla-garden-cupcake-box",
        name: "Vanilla Garden Cupcake Box",
        description:
            "Delicate vanilla cupcakes topped with silky pastel buttercream.",
        price: 18,
        category: "Cakes",
        image:
            "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80&sat=-10",
        featured: true,
    },
    {
        id: "5",
        slug: "chocolate-fudge-cake",
        name: "Chocolate Fudge Cake",
        description:
            "Decadent dark chocolate sponge with glossy fudge ganache layers.",
        price: 38,
        category: "Cakes",
        image:
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "6",
        slug: "multigrain-country-bread",
        name: "Multigrain Country Bread",
        description:
            "Wholesome loaf packed with seeds and grains, perfect for breakfast.",
        price: 11,
        category: "Bread",
        image:
            "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "7",
        slug: "classic-butter-pastry",
        name: "Classic Butter Pastry",
        description:
            "Golden-baked pastry with butter-rich laminated dough and soft center.",
        price: 7,
        category: "Pastries",
        image:
            "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "8",
        slug: "strawberry-cream-cupcake",
        name: "Strawberry Cream Cupcake",
        description:
            "Soft cupcake finished with strawberry cream swirls and berry dust.",
        price: 5,
        category: "Pastries",
        image:
            "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=80",
    },
];

export const featuredProducts = products.filter((product) => product.featured);

export function getProductBySlug(slug: string) {
    return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(currentSlug: string, category: ProductCategory) {
    return products
        .filter((product) => product.slug !== currentSlug && product.category === category)
        .slice(0, 4);
}
