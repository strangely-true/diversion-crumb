import { InventoryReason, ProductStatus } from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import {
  createProductSchema,
  updateProductSchema,
  adjustInventorySchema,
  listProductsQuerySchema,
} from "@/server/validation/product.schemas";

type ListProductsInput = ReturnType<typeof listProductsQuerySchema.parse>;
type CreateProductInput = ReturnType<typeof createProductSchema.parse>;
type UpdateProductInput = ReturnType<typeof updateProductSchema.parse>;
type AdjustInventoryInput = ReturnType<typeof adjustInventorySchema.parse>;

export class ProductService {
  static async listProducts(input: ListProductsInput, isAdmin = false) {
    const where = {
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" as const } },
              { description: { contains: input.search, mode: "insensitive" as const } },
              { slug: { contains: input.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(input.categorySlug ? { category: { slug: input.categorySlug } } : {}),
      ...((isAdmin && input.includeDrafts)
        ? (input.status ? { status: input.status } : {})
        : { status: ProductStatus.ACTIVE }),
    };

    const skip = (input.page - 1) * input.pageSize;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: input.pageSize,
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: {
            where: { isActive: true },
            include: { inventory: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }

  static async getProductById(productId: string, isAdmin = false) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: isAdmin ? undefined : { isActive: true },
          include: { inventory: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
    }

    if (!isAdmin && product.status !== ProductStatus.ACTIVE) {
      throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
    }

    return product;
  }

  static async createProduct(input: CreateProductInput, adminUserId: string) {
    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const product = await db.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          status: input.status,
          tags: input.tags,
          heroImage: input.heroImage,
          categoryId: input.categoryId,
          images: {
            create: input.images,
          },
          variants: {
            create: input.variants.map((variant) => ({
              sku: variant.sku,
              label: variant.label,
              description: variant.description,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              currency: variant.currency,
              isActive: variant.isActive,
              weight: variant.weight,
            })),
          },
        },
        include: {
          variants: true,
          images: true,
        },
      });

      for (const variant of input.variants) {
        const createdVariant = product.variants.find(
          (candidate: { id: string; sku: string }) => candidate.sku === variant.sku,
        );

        if (!createdVariant) {
          continue;
        }

        const inventory = await db.inventoryLevel.create({
          data: {
            variantId: createdVariant.id,
            quantity: variant.initialStock,
            lowStockThreshold: variant.lowStockThreshold,
          },
        });

        await db.inventoryTransaction.create({
          data: {
            inventoryLevelId: inventory.id,
            variantId: createdVariant.id,
            quantity: variant.initialStock,
            reason: InventoryReason.INITIAL,
            reference: `PRODUCT_CREATE:${product.id}`,
            createdById: adminUserId,
          },
        });
      }

      return db.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { include: { inventory: true }, orderBy: { createdAt: "asc" } },
        },
      });
    });
  }

  static async updateProduct(productId: string, input: UpdateProductInput) {
    await this.getProductById(productId, true);

    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      await db.product.update({
        where: { id: productId },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          status: input.status,
          tags: input.tags,
          heroImage: input.heroImage === null ? null : input.heroImage,
          categoryId: input.categoryId === null ? null : input.categoryId,
        },
      });

      if (input.images) {
        await db.productImage.deleteMany({ where: { productId } });
        if (input.images.length > 0) {
          await db.productImage.createMany({
            data: input.images.map((image) => ({
              productId,
              url: image.url,
              altText: image.altText,
              sortOrder: image.sortOrder,
            })),
          });
        }
      }

      return db.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { include: { inventory: true }, orderBy: { createdAt: "asc" } },
        },
      });
    });
  }

  static async deleteProduct(productId: string) {
    await this.getProductById(productId, true);

    await prisma.product.delete({ where: { id: productId } });

    return {
      success: true,
      deletedProductId: productId,
    };
  }

  static async adjustInventory(variantId: string, input: AdjustInventoryInput, adminUserId: string) {
    const inventory = await prisma.inventoryLevel.findUnique({
      where: { variantId },
      include: { variant: true },
    });

    if (!inventory) {
      throw new AppError("Inventory record not found for this variant.", 404, "INVENTORY_NOT_FOUND");
    }

    const nextQuantity = inventory.quantity + input.quantityDelta;

    if (nextQuantity < 0) {
      throw new AppError("Inventory cannot go below zero.", 400, "INVALID_INVENTORY_DELTA");
    }

    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const updated = await db.inventoryLevel.update({
        where: { id: inventory.id },
        data: {
          quantity: nextQuantity,
        },
      });

      await db.inventoryTransaction.create({
        data: {
          inventoryLevelId: inventory.id,
          variantId,
          quantity: input.quantityDelta,
          reason: input.reason,
          reference: input.reference,
          createdById: adminUserId,
        },
      });

      return updated;
    });
  }
}
