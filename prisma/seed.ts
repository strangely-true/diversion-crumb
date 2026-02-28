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

  const velvetCake = await prisma.product.create({
    data: {
      name: "Signature Red Velvet Cake",
      slug: "signature-red-velvet-cake",
      description: "Classic red velvet layers with cream cheese frosting.",
      status: ProductStatus.ACTIVE,
      tags: ["featured", "celebration"],
      heroImage: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
      categoryId: cakes.id,
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
            label: "1kg",
            price: 34,
            currency: "USD",
            isActive: true,
          },
          {
            sku: "CAKE-RV-2KG",
            label: "2kg",
            price: 58,
            currency: "USD",
            isActive: true,
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
      heroImage: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=1200&q=80",
      categoryId: bread.id,
      variants: {
        create: [
          {
            sku: "BRD-SD-700G",
            label: "700g",
            price: 9,
            currency: "USD",
            isActive: true,
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
      heroImage: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
      categoryId: pastries.id,
      variants: {
        create: [
          {
            sku: "PAS-ALM-1PC",
            label: "Single",
            price: 6,
            currency: "USD",
            isActive: true,
          },
          {
            sku: "PAS-ALM-4PC",
            label: "Box of 4",
            price: 22,
            currency: "USD",
            isActive: true,
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
  ];

  for (const variant of allVariants) {
    const quantity = variant.sku.includes("2KG") ? 8 : variant.sku.includes("4PC") ? 18 : 30;

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

  console.log("Seed completed successfully.");
  console.log("Admin:", admin.email, admin.id);
  console.log("Customer:", customer.email, customer.id);
  console.log("Category (cakes):", cakes.id);
  console.log("Product (red velvet):", velvetCake.id);
  console.log("Variant (red velvet 1kg):", velvetCake.variants[0].id);
  console.log("Sample cart id:", cart.id);
  console.log("Sample cart item id:", primaryCartItemId);
  console.log("Sample order id:", seededOrder.id);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
