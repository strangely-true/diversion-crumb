import { InventoryReason, ProductStatus, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import { ProductService } from "@/server/services/product.service";

type CreateQuickProductInput = {
  name: string;
  slug?: string;
  description?: string;
  tags?: string[];
  heroImage?: string;
  servingSize?: string;
  ingredients?: string;
  allergens?: string[];
  nutritionPerServing?: {
    calories?: number;
    fatG?: number;
    saturatedFatG?: number;
    carbsG?: number;
    sugarG?: number;
    proteinG?: number;
    fiberG?: number;
    sodiumMg?: number;
  };
  categoryId: string;
  price: number;
  stock?: number;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resolveUniqueProductSlug(baseSlug: string) {
  let candidate = baseSlug;
  let suffix = 2;

  while (await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export class AdminService {
  static async getDashboardStats() {
    const [users, products, orders, conversations, payments, shipments] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.conversation.count(),
        prisma.payment.count(),
        prisma.shipment.count(),
      ]);

    return { users, products, orders, conversations, payments, shipments };
  }

  static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateUserRole(userId: string, role: UserRole, actingAdminId: string) {
    if (userId === actingAdminId && role !== UserRole.ADMIN) {
      throw new AppError("You cannot remove your own admin role.", 400, "INVALID_ROLE_CHANGE");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });
  }

  static async deleteUser(userId: string, actingAdminId: string) {
    if (userId === actingAdminId) {
      throw new AppError("You cannot delete your own account.", 400, "INVALID_USER_DELETE");
    }

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        throw new AppError("User not found.", 404, "USER_NOT_FOUND");
      }

      if (user.role === UserRole.ADMIN) {
        const adminCount = await tx.user.count({
          where: { role: UserRole.ADMIN },
        });

        if (adminCount <= 1) {
          throw new AppError("You cannot delete the last admin user.", 400, "LAST_ADMIN_DELETE_BLOCKED");
        }
      }

      await tx.user.delete({
        where: { id: userId },
      });

      return { id: userId };
    });
  }

  static async getProducts() {
    return prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          include: {
            inventory: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getProductCategories() {
    return prisma.productCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });
  }

  static async createQuickProduct(input: CreateQuickProductInput, adminUserId: string) {
    const slugBase = input.slug?.trim() || slugify(input.name);
    if (!slugBase) {
      throw new AppError("Product slug cannot be empty.", 400, "INVALID_SLUG");
    }

    const uniqueSlug = await resolveUniqueProductSlug(slugBase);

    const skuSeed = uniqueSlug.replace(/-/g, "").toUpperCase().slice(0, 8) || "BAKERY";
    const sku = `${skuSeed}-${Date.now().toString().slice(-6)}`;

    return ProductService.createProduct(
      {
        name: input.name,
        slug: uniqueSlug,
        description: input.description,
        status: ProductStatus.ACTIVE,
        tags: input.tags ?? [],
        heroImage: input.heroImage,
        servingSize: input.servingSize,
        ingredients: input.ingredients,
        allergens: input.allergens ?? [],
        nutritionPerServing: input.nutritionPerServing,
        categoryId: input.categoryId,
        images: input.heroImage
          ? [
              {
                url: input.heroImage,
                altText: input.name,
                sortOrder: 0,
              },
            ]
          : [],
        variants: [
          {
            sku,
            label: "Default",
            description: "Default variant",
            price: input.price,
            currency: "USD",
            isActive: true,
            initialStock: input.stock ?? 0,
            lowStockThreshold: 2,
          },
        ],
      },
      adminUserId,
    );
  }

  static async getInventoryItems() {
    return prisma.inventoryLevel.findMany({
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            label: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [
        { variant: { product: { name: "asc" } } },
        { variant: { label: "asc" } },
      ],
    });
  }

  static async adjustVariantInventory(variantId: string, quantityDelta: number, actingAdminId: string) {
    return ProductService.adjustInventory(
      variantId,
      {
        quantityDelta,
        reason: InventoryReason.MANUAL,
        reference: "ADMIN_PANEL",
      },
      actingAdminId,
    );
  }

  static async removeProduct(productId: string) {
    return ProductService.deleteProduct(productId);
  }

  static async clearProductImage(productId: string) {
    return ProductService.updateProduct(productId, {
      heroImage: null,
      images: [],
    });
  }

  static async setProductImage(productId: string, imageUrl: string, altText?: string) {
    return ProductService.updateProduct(productId, {
      heroImage: imageUrl,
      images: [
        {
          url: imageUrl,
          altText,
          sortOrder: 0,
        },
      ],
    });
  }

  static async getConversations() {
    return prisma.conversation.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  static async getShippingAndPayments() {
    return prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        shipments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { placedAt: "desc" },
    });
  }
}