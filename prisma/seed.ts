import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import {
  CartStatus,
  InventoryReason,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  ShipmentStatus,
  UserRole,
} from "../generated/prisma/enums";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run seed.");
}

const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Clear dependent tables first ────────────────────────────────────────────
  await prisma.conversationMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.knowledgeEntry.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderStatusEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.orderAddress.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryLevel.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      id: "auth0|seed-admin",
      email: "admin@bakery.demo",
      name: "Bakery Admin",
      phone: "+15550000001",
      role: UserRole.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      id: "auth0|seed-customer",
      email: "customer@bakery.demo",
      name: "Mia Customer",
      phone: "+15550000002",
      role: UserRole.CUSTOMER,
    },
  });

  await prisma.address.createMany({
    data: [
      {
        userId: customer.id,
        label: "Home",
        line1: "42 Baker Street",
        city: "Austin",
        state: "TX",
        postalCode: "73301",
        country: "US",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      {
        userId: customer.id,
        label: "Office",
        line1: "900 Congress Ave",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "US",
        isDefaultShipping: false,
        isDefaultBilling: false,
      },
    ],
  });

  const cakes = await prisma.productCategory.create({
    data: {
      name: "Cakes",
      slug: "cakes",
      description: "Layer cakes and celebration cakes.",
    },
  });

  const bread = await prisma.productCategory.create({
    data: {
      name: "Bread",
      slug: "bread",
      description: "Fresh artisan loaves.",
    },
  });

  const pastries = await prisma.productCategory.create({
    data: {
      name: "Pastries",
      slug: "pastries",
      description: "Croissants, danishes, and more.",
    },
  });

  const cookies = await prisma.productCategory.create({
    data: {
      name: "Cookies",
      slug: "cookies",
      description: "Hand-crafted cookies baked fresh daily.",
    },
  });

  const muffins = await prisma.productCategory.create({
    data: {
      name: "Muffins",
      slug: "muffins",
      description: "Moist muffins in a variety of flavours.",
    },
  });

  const velvetCake = await prisma.product.create({
    data: {
      name: "Signature Red Velvet Cake",
      slug: "signature-red-velvet-cake",
      description: "Classic red velvet layers with cream cheese frosting.",
      status: ProductStatus.ACTIVE,
      tags: ["featured", "celebration"],
      heroImage:
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
      categoryId: cakes.id,
      servingSize: "1 slice (120g)",
      ingredients:
        "Enriched flour, sugar, butter, eggs, buttermilk, cocoa powder, red food colouring, baking soda, salt, cream cheese, vanilla extract",
      allergens: ["gluten", "dairy", "eggs"],
      nutritionPerServing: {
        calories: 480,
        fatG: 22,
        saturatedFatG: 14,
        carbsG: 64,
        sugarG: 48,
        proteinG: 6,
        fiberG: 1,
        sodiumMg: 310,
      },
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
            altText: "Red velvet cake",
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "CAKE-RV-1KG",
            label: "1 kg (serves ~8)",
            price: 34,
            currency: "USD",
            isActive: true,
            weight: 1000,
          },
          {
            sku: "CAKE-RV-2KG",
            label: "2 kg (serves ~16)",
            price: 58,
            currency: "USD",
            isActive: true,
            weight: 2000,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const sourdough = await prisma.product.create({
    data: {
      name: "Artisan Sourdough Loaf",
      slug: "artisan-sourdough-loaf",
      description: "Naturally fermented sourdough with crisp crust.",
      status: ProductStatus.ACTIVE,
      tags: ["daily-fresh"],
      heroImage:
        "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80",
      categoryId: bread.id,
      servingSize: "1 slice (50g)",
      ingredients:
        "Organic wheat flour, water, sea salt, sourdough starter (wheat flour, water)",
      allergens: ["gluten"],
      nutritionPerServing: {
        calories: 120,
        fatG: 0.5,
        saturatedFatG: 0,
        carbsG: 24,
        sugarG: 1,
        proteinG: 4,
        fiberG: 1,
        sodiumMg: 230,
      },
      variants: {
        create: [
          {
            sku: "BRD-SD-700G",
            label: "700g loaf",
            price: 9,
            currency: "USD",
            isActive: true,
            weight: 700,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const croissant = await prisma.product.create({
    data: {
      name: "Butter Almond Croissant",
      slug: "butter-almond-croissant",
      description: "Flaky croissant with almond cream filling.",
      status: ProductStatus.ACTIVE,
      tags: ["best-seller"],
      heroImage:
        "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
      categoryId: pastries.id,
      servingSize: "1 croissant (85g)",
      ingredients:
        "Wheat flour, butter, sugar, eggs, whole milk, almond meal, almond extract, salt, yeast",
      allergens: ["gluten", "dairy", "eggs", "nuts"],
      nutritionPerServing: {
        calories: 340,
        fatG: 18,
        saturatedFatG: 10,
        carbsG: 38,
        sugarG: 12,
        proteinG: 7,
        fiberG: 2,
        sodiumMg: 190,
      },
      variants: {
        create: [
          {
            sku: "PAS-ALM-1PC",
            label: "Single",
            price: 6,
            currency: "USD",
            isActive: true,
            weight: 85,
          },
          {
            sku: "PAS-ALM-4PC",
            label: "Box of 4",
            price: 22,
            currency: "USD",
            isActive: true,
            weight: 340,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // ── Additional products ────────────────────────────────────────────────────

  const chocCookie = await prisma.product.create({
    data: {
      name: "Double Chocolate Chip Cookie",
      slug: "double-chocolate-chip-cookie",
      description:
        "Chewy dark-chocolate cookies loaded with chocolate chips — warm from the oven daily.",
      status: ProductStatus.ACTIVE,
      tags: ["best-seller", "daily-fresh"],
      heroImage:
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80",
      categoryId: cookies.id,
      servingSize: "1 cookie (65g)",
      ingredients:
        "Wheat flour, dark chocolate chips, butter, brown sugar, eggs, vanilla extract, baking soda, sea salt, cocoa powder",
      allergens: ["gluten", "dairy", "eggs"],
      nutritionPerServing: {
        calories: 290,
        fatG: 14,
        saturatedFatG: 8,
        carbsG: 40,
        sugarG: 28,
        proteinG: 4,
        fiberG: 2,
        sodiumMg: 180,
      },
      variants: {
        create: [
          {
            sku: "COOK-CC-1PC",
            label: "Single",
            price: 3.5,
            currency: "USD",
            isActive: true,
            weight: 65,
          },
          {
            sku: "COOK-CC-6PC",
            label: "Half dozen (6)",
            price: 18,
            currency: "USD",
            isActive: true,
            weight: 390,
          },
          {
            sku: "COOK-CC-12PC",
            label: "Full dozen (12)",
            price: 32,
            currency: "USD",
            isActive: true,
            weight: 780,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const blueberryMuffin = await prisma.product.create({
    data: {
      name: "Wild Blueberry Muffin",
      slug: "wild-blueberry-muffin",
      description:
        "Tall, fluffy muffins with a sugar-crumble top and jam-packed wild blueberries.",
      status: ProductStatus.ACTIVE,
      tags: ["daily-fresh", "popular"],
      heroImage:
        "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=1200&q=80",
      categoryId: muffins.id,
      servingSize: "1 muffin (110g)",
      ingredients:
        "Wheat flour, wild blueberries, sugar, butter, eggs, whole milk, baking powder, vanilla extract, lemon zest, salt",
      allergens: ["gluten", "dairy", "eggs"],
      nutritionPerServing: {
        calories: 310,
        fatG: 11,
        saturatedFatG: 6,
        carbsG: 48,
        sugarG: 26,
        proteinG: 5,
        fiberG: 2,
        sodiumMg: 210,
      },
      variants: {
        create: [
          {
            sku: "MUF-BB-1PC",
            label: "Single",
            price: 4,
            currency: "USD",
            isActive: true,
            weight: 110,
          },
          {
            sku: "MUF-BB-4PC",
            label: "Box of 4",
            price: 14,
            currency: "USD",
            isActive: true,
            weight: 440,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const lemonCake = await prisma.product.create({
    data: {
      name: "Lemon Drizzle Cake",
      slug: "lemon-drizzle-cake",
      description:
        "Light sponge soaked in tangy lemon syrup, finished with a crisp lemon glaze.",
      status: ProductStatus.ACTIVE,
      tags: ["featured", "seasonal"],
      heroImage:
        "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=1200&q=80",
      categoryId: cakes.id,
      servingSize: "1 slice (90g)",
      ingredients:
        "Wheat flour, sugar, butter, eggs, lemon juice, lemon zest, icing sugar, baking powder, salt",
      allergens: ["gluten", "dairy", "eggs"],
      nutritionPerServing: {
        calories: 390,
        fatG: 16,
        saturatedFatG: 9,
        carbsG: 57,
        sugarG: 38,
        proteinG: 5,
        fiberG: 1,
        sodiumMg: 170,
      },
      variants: {
        create: [
          {
            sku: "CAKE-LEM-LOAF",
            label: "Loaf (serves ~8)",
            price: 28,
            currency: "USD",
            isActive: true,
            weight: 700,
          },
          {
            sku: "CAKE-LEM-MINI",
            label: "Mini loaf (serves ~3)",
            price: 12,
            currency: "USD",
            isActive: true,
            weight: 260,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const cinnamonRoll = await prisma.product.create({
    data: {
      name: "Classic Cinnamon Roll",
      slug: "classic-cinnamon-roll",
      description:
        "Soft, pillowy rolls swirled with brown sugar and cinnamon, topped with cream cheese icing.",
      status: ProductStatus.ACTIVE,
      tags: ["best-seller", "weekend-special"],
      heroImage:
        "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=1200&q=80",
      categoryId: pastries.id,
      servingSize: "1 roll (130g)",
      ingredients:
        "Wheat flour, butter, whole milk, eggs, sugar, brown sugar, cinnamon, yeast, salt, cream cheese, vanilla extract",
      allergens: ["gluten", "dairy", "eggs"],
      nutritionPerServing: {
        calories: 420,
        fatG: 17,
        saturatedFatG: 10,
        carbsG: 62,
        sugarG: 30,
        proteinG: 7,
        fiberG: 2,
        sodiumMg: 290,
      },
      variants: {
        create: [
          {
            sku: "PAS-CIN-1PC",
            label: "Single",
            price: 5,
            currency: "USD",
            isActive: true,
            weight: 130,
          },
          {
            sku: "PAS-CIN-6PC",
            label: "Half dozen (6)",
            price: 26,
            currency: "USD",
            isActive: true,
            weight: 780,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const allVariants = [
    ...velvetCake.variants,
    ...sourdough.variants,
    ...croissant.variants,
    ...chocCookie.variants,
    ...blueberryMuffin.variants,
    ...lemonCake.variants,
    ...cinnamonRoll.variants,
  ];

  for (const variant of allVariants) {
    const quantity =
      variant.sku.includes("2KG") || variant.sku.includes("LOAF")
        ? 8
        : variant.sku.includes("12PC") || variant.sku.includes("6PC")
          ? 15
          : variant.sku.includes("4PC")
            ? 20
            : 30;

    const inventoryLevel = await prisma.inventoryLevel.create({
      data: {
        variantId: variant.id,
        quantity,
        reserved: 0,
        lowStockThreshold: 5,
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        inventoryLevelId: inventoryLevel.id,
        variantId: variant.id,
        quantity,
        reason: InventoryReason.INITIAL,
        reference: `SEED:${variant.sku}`,
        createdById: admin.id,
      },
    });
  }

  const cart = await prisma.cart.create({
    data: {
      userId: customer.id,
      status: CartStatus.ACTIVE,
      currency: "USD",
      items: {
        create: [
          {
            variantId: velvetCake.variants[0].id,
            quantity: 1,
            unitPrice: 34,
          },
          {
            variantId: croissant.variants[1].id,
            quantity: 1,
            unitPrice: 22,
          },
        ],
      },
    },
    include: { items: true },
  });

  const primaryCartItemId = cart.items[0]?.id ?? "";

  const shippingAddress = await prisma.orderAddress.create({
    data: {
      fullName: customer.name ?? "Mia Customer",
      phone: customer.phone,
      line1: "42 Baker Street",
      city: "Austin",
      state: "TX",
      postalCode: "73301",
      country: "US",
    },
  });

  const billingAddress = await prisma.orderAddress.create({
    data: {
      fullName: customer.name ?? "Mia Customer",
      phone: customer.phone,
      line1: "42 Baker Street",
      city: "Austin",
      state: "TX",
      postalCode: "73301",
      country: "US",
    },
  });

  const seededOrder = await prisma.order.create({
    data: {
      orderNumber: `BKY-SEED-${Date.now()}`,
      userId: customer.id,
      cartId: cart.id,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.CAPTURED,
      shipmentStatus: ShipmentStatus.PREPARING,
      subtotal: 56,
      tax: 4.48,
      shippingFee: 0,
      discountTotal: 0,
      total: 60.48,
      currency: "USD",
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      items: {
        create: [
          {
            variantId: velvetCake.variants[0].id,
            productName: velvetCake.name,
            variantName: velvetCake.variants[0].label,
            quantity: 1,
            unitPrice: 34,
            currency: "USD",
            imageUrl: velvetCake.heroImage,
          },
          {
            variantId: croissant.variants[1].id,
            productName: croissant.name,
            variantName: croissant.variants[1].label,
            quantity: 1,
            unitPrice: 22,
            currency: "USD",
            imageUrl: croissant.heroImage,
          },
        ],
      },
      statusEvents: {
        create: [
          {
            status: OrderStatus.PENDING,
            note: "Order received",
            createdById: customer.id,
          },
          {
            status: OrderStatus.CONFIRMED,
            note: "Order confirmed by bakery",
            createdById: admin.id,
          },
        ],
      },
      payments: {
        create: {
          provider: "mock-gateway",
          method: PaymentMethod.CARD,
          status: PaymentStatus.CAPTURED,
          amount: 60.48,
          currency: "USD",
          transactionId: `mock_seed_${Date.now()}`,
          metadata: { seeded: true },
          processedAt: new Date(),
        },
      },
      shipments: {
        create: {
          carrier: "BakeryExpress",
          trackingNumber: `BKYTRACK${Date.now()}`,
          status: ShipmentStatus.PREPARING,
          events: {
            create: {
              status: ShipmentStatus.PREPARING,
              description: "Packing in progress",
              location: "Main Kitchen",
            },
          },
        },
      },
    },
  });

  await prisma.cart.update({
    where: { id: cart.id },
    data: { status: CartStatus.CHECKED_OUT },
  });

  // ── Knowledge Base ─────────────────────────────────────────────────────────
  await prisma.knowledgeEntry.createMany({
    data: [
      // ── Store information ────────────────────────────────────────────────────
      {
        title: "Store Hours",
        category: "store-info",
        tags: ["hours", "opening", "closing", "when"],
        content:
          "The Golden Crumb Bakery is open Monday to Friday from 7:00 AM to 6:00 PM, Saturday 7:00 AM to 4:00 PM, and closed on Sundays. Public holiday hours may vary — check our website or call ahead.",
      },
      {
        title: "Location & Contact",
        category: "store-info",
        tags: ["address", "location", "phone", "email", "contact"],
        content:
          "We are located at 42 Baker Street, Austin, TX 73301. Phone: +1 (555) 000-1234. Email: hello@goldencrumb.demo. Parking is available on Baker Street and in the lot behind the building.",
      },
      {
        title: "Online Ordering & Delivery",
        category: "store-info",
        tags: ["delivery", "shipping", "order online", "pickup"],
        content:
          "We offer free same-day pickup for orders placed before 11 AM. Local delivery (Austin metro area) is available Tuesday–Saturday for a flat $5 fee on orders over $20, and $8 on orders under $20. We do not currently ship interstate. Estimated delivery window is 2–4 hours after order confirmation.",
      },

      // ── Products / menu ─────────────────────────────────────────────────────
      {
        title: "Our Menu Overview",
        category: "product",
        tags: ["menu", "products", "what do you sell", "range"],
        content:
          "The Golden Crumb Bakery bakes fresh every morning. Our menu includes: Cakes (Red Velvet, Lemon Drizzle), Breads (Artisan Sourdough), Pastries (Butter Almond Croissant, Classic Cinnamon Roll), Cookies (Double Chocolate Chip), and Muffins (Wild Blueberry). All items are baked in-house without preservatives. Availability is subject to daily stock.",
      },
      {
        title: "Custom Cakes & Special Orders",
        category: "product",
        tags: [
          "custom",
          "celebration cake",
          "wedding",
          "birthday",
          "special order",
        ],
        content:
          "We take custom cake orders with at least 72 hours notice. Custom cakes start from $55 for a 1 kg cake. Please contact us at hello@goldencrumb.demo or call +1 (555) 000-1234 to discuss flavours, designs, and dietary requirements. We can accommodate gluten-free sponge and dairy-free frosting on custom orders for an additional fee.",
      },
      {
        title: "Daily Fresh Guarantee",
        category: "product",
        tags: ["fresh", "baked today", "shelf life", "when baked"],
        content:
          "All our items are baked fresh the same morning before 6 AM. Items not sold by close of day are donated to local food banks — we never sell day-old goods. For best freshness, consume cakes and pastries within 2 days, bread within 3 days, and cookies / muffins within 5 days of purchase.",
      },

      // ── Allergen & dietary ───────────────────────────────────────────────────
      {
        title: "Allergen Information & Policy",
        category: "allergy",
        tags: [
          "allergen",
          "allergy",
          "nut free",
          "gluten",
          "dairy free",
          "egg free",
          "safe",
        ],
        content:
          "Our kitchen handles gluten, dairy, eggs, nuts (almonds, hazelnuts), and soy on a daily basis. Cross-contamination cannot be fully ruled out for any item. Items that contain nuts or may contain traces of nuts are clearly marked on our product pages. We do not have a dedicated allergen-free production area. Customers with severe allergies should exercise caution and consult staff before ordering.",
      },
      {
        title: "Gluten-Free Options",
        category: "allergy",
        tags: ["gluten free", "coeliac", "celiac", "wheat free"],
        content:
          "Currently our only confirmed gluten-free product is made to order for custom cakes (using certified GF flour blend). All standard menu items contain gluten. We are working on expanding our GF range in 2026.",
      },
      {
        title: "Vegan & Dairy-Free Options",
        category: "allergy",
        tags: ["vegan", "dairy free", "plant based", "no dairy", "no eggs"],
        content:
          "We do not currently have dedicated vegan products on our everyday menu. Custom orders can be made dairy-free or egg-free upon request — please discuss with us at least 72 hours in advance. Our sourdough bread is dairy-free and egg-free but contains gluten.",
      },
      {
        title: "Nut Allergen Guide",
        category: "allergy",
        tags: ["nuts", "almond", "nut allergy", "tree nut", "peanut"],
        content:
          "Products containing nuts: Butter Almond Croissant (contains almonds). All other products do not have nuts as an ingredient, but are produced in a kitchen that handles almonds and may contain traces. We do not use peanuts or peanut products in our bakery.",
      },

      // ── Orders & returns ─────────────────────────────────────────────────────
      {
        title: "Returns & Refund Policy",
        category: "policy",
        tags: ["refund", "return", "exchange", "wrong order", "complaint"],
        content:
          "If your order arrives damaged, incorrect, or does not meet our quality standard, please contact us within 24 hours of receipt with a photo. We will offer a full replacement or store credit. We do not offer cash refunds for change-of-mind purchases. Custom cake deposits (50%) are non-refundable once production has started.",
      },
      {
        title: "Order Cancellation Policy",
        category: "policy",
        tags: ["cancel", "cancellation", "change order"],
        content:
          "Standard orders can be cancelled for a full refund up to 2 hours after placement, provided preparation has not started. Custom orders can be cancelled up to 48 hours before the scheduled pickup/delivery date; after that, the 50% deposit is forfeited.",
      },
      {
        title: "Payment Methods",
        category: "policy",
        tags: ["payment", "pay", "credit card", "cash", "contactless"],
        content:
          "We accept all major credit and debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and cash in-store. Online orders are processed securely via Stripe. We do not accept cheques.",
      },

      // ── Nutrition & health ──────────────────────────────────────────────────
      {
        title: "Calorie & Nutrition Information",
        category: "nutrition",
        tags: [
          "calories",
          "nutrition",
          "macros",
          "carbs",
          "fat",
          "protein",
          "health",
        ],
        content:
          "Nutrition information for all our products is available on each product page. Our most popular items: Red Velvet Cake slice ~480 kcal, Sourdough slice ~120 kcal, Almond Croissant ~340 kcal, Chocolate Chip Cookie ~290 kcal, Blueberry Muffin ~310 kcal, Cinnamon Roll ~420 kcal, Lemon Drizzle slice ~390 kcal.",
      },
      {
        title: "Ingredients & Sourcing",
        category: "nutrition",
        tags: ["ingredients", "organic", "local", "sourcing", "where from"],
        content:
          "We source our flour from a local Texas mill, use free-range eggs from a nearby farm, and use European-style cultured butter. Whenever possible we use seasonal, locally-sourced fruits and flavourings. We do not use artificial preservatives or trans fats in any of our products.",
      },

      // ── Loyalty & promotions ─────────────────────────────────────────────────
      {
        title: "Loyalty Program",
        category: "promotions",
        tags: ["loyalty", "points", "rewards", "discount", "member"],
        content:
          "Our loyalty program is coming soon! Sign up for our newsletter at the website footer to be the first to hear when it launches. In the meantime, follow us on Instagram @goldencrumbbakery for weekly flash discounts and free-item giveaways.",
      },
      {
        title: "Bulk & Corporate Orders",
        category: "promotions",
        tags: [
          "bulk",
          "corporate",
          "office",
          "large order",
          "event",
          "catering",
        ],
        content:
          "We offer 10% off on orders of $150 or more for corporate clients and events. Contact hello@goldencrumb.demo with your requirements at least 5 days in advance. We can also arrange branded packaging for corporate gifting.",
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log("Admin:", admin.email, admin.id);
  console.log("Customer:", customer.email, customer.id);
  console.log("Category (cakes):", cakes.id);
  console.log("Product (red velvet):", velvetCake.id);
  console.log("Variant (red velvet 1kg):", velvetCake.variants[0].id);
  console.log("Sample cart id:", cart.id);
  console.log("Sample cart item id:", primaryCartItemId);
  console.log("Sample order id:", seededOrder.id);
  console.log("Knowledge entries seeded:", await prisma.knowledgeEntry.count());
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
