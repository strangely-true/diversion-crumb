import { ProductStatus, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import { ProductService } from "@/server/services/product.service";

type CreateQuickProductInput = {
  name: string;
  slug?: string;
  description?: string;
  heroImage?: string;
  price: number;
  stock: number;
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

  static async getProducts() {
    return prisma.product.findMany({
      include: {
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

  static async createQuickProduct(input: CreateQuickProductInput, adminUserId: string) {
    const slugBase = input.slug?.trim() || slugify(input.name);
    if (!slugBase) {
      throw new AppError("Product slug cannot be empty.", 400, "INVALID_SLUG");
    }

    const skuSeed = slugBase.replace(/-/g, "").toUpperCase().slice(0, 8) || "BAKERY";
    const sku = `${skuSeed}-${Date.now().toString().slice(-6)}`;

    return ProductService.createProduct(
      {
        name: input.name,
        slug: slugBase,
        description: input.description,
        status: ProductStatus.ACTIVE,
        tags: [],
        heroImage: input.heroImage,
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
            initialStock: input.stock,
            lowStockThreshold: 2,
          },
        ],
      },
      adminUserId,
    );
  }

  static async removeProduct(productId: string) {
    return ProductService.deleteProduct(productId);
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