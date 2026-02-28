import {
  CartStatus,
  InventoryReason,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import { createOrderSchema, updateOrderStatusSchema } from "@/server/validation/order.schemas";

type CreateOrderInput = ReturnType<typeof createOrderSchema.parse>;
type UpdateOrderStatusInput = ReturnType<typeof updateOrderStatusSchema.parse>;

function createOrderNumber() {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BKY-${stamp}-${random}`;
}

function asMoney(value: number) {
  return Number(value.toFixed(2));
}

export class OrderService {
  static async createFromCart(userId: string | undefined, role: UserRole | undefined, input: CreateOrderInput) {
    const cart = await prisma.cart.findUnique({
      where: { id: input.cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.status !== CartStatus.ACTIVE) {
      throw new AppError("Cart is not available for checkout.", 400, "CART_NOT_CHECKOUT_READY");
    }

    if (role !== UserRole.ADMIN) {
      if (!userId || !cart.userId || cart.userId !== userId) {
        throw new AppError("Cannot checkout another user's cart.", 403, "FORBIDDEN");
      }
    }

    if (cart.items.length === 0) {
      throw new AppError("Cart is empty.", 400, "EMPTY_CART");
    }

    const cartItems = cart.items;

    for (const item of cartItems) {
      const available = item.variant.inventory?.quantity ?? 0;
      if (available < item.quantity) {
        throw new AppError(
          `Insufficient inventory for variant ${item.variant.sku}.`,
          400,
          "INSUFFICIENT_INVENTORY",
        );
      }
    }

    const subtotal = asMoney(
      cartItems.reduce((sum: number, item) => sum + Number(item.unitPrice) * item.quantity, 0),
    );
    const tax = asMoney(subtotal * 0.08);
    const shippingFee = subtotal >= 50 ? 0 : 5;
    const discountTotal = 0;
    const total = asMoney(subtotal + tax + shippingFee - discountTotal);

    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const shippingAddress = await db.orderAddress.create({
        data: input.shippingAddress,
      });

      const billingAddress = await db.orderAddress.create({
        data: input.billingAddress ?? input.shippingAddress,
      });

      const order = await db.order.create({
        data: {
          orderNumber: createOrderNumber(),
          userId: cart.userId,
          cartId: cart.id,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shipmentStatus: ShipmentStatus.PREPARING,
          subtotal,
          tax,
          shippingFee,
          discountTotal,
          total,
          currency: cart.currency,
          notes: input.notes,
          shippingAddressId: shippingAddress.id,
          billingAddressId: billingAddress.id,
          items: {
            create: cartItems.map((item) => ({
              variantId: item.variantId,
              productName: item.variant.product.name,
              variantName: item.variant.label,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              currency: cart.currency,
              imageUrl: item.variant.product.heroImage,
            })),
          },
          statusEvents: {
            create: {
              status: OrderStatus.PENDING,
              note: "Order created from cart checkout.",
              createdById: userId,
            },
          },
        },
        include: {
          items: true,
          payments: true,
          shipments: true,
          statusEvents: { orderBy: { createdAt: "desc" } },
        },
      });

      for (const item of cartItems) {
        const inventory = item.variant.inventory;
        if (!inventory) {
          throw new AppError("Inventory record missing for variant.", 500, "INVENTORY_NOT_FOUND");
        }

        await db.inventoryLevel.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        await db.inventoryTransaction.create({
          data: {
            inventoryLevelId: inventory.id,
            variantId: item.variantId,
            quantity: -item.quantity,
            reason: InventoryReason.ORDER_FULFILLED,
            reference: `ORDER:${order.id}`,
            createdById: userId,
          },
        });
      }

      await db.cart.update({
        where: { id: cart.id },
        data: {
          status: CartStatus.CHECKED_OUT,
        },
      });

      return order;
    });
  }

  static async getOrdersForUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
        statusEvents: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { placedAt: "desc" },
    });
  }

  static async getOrderById(orderId: string, userId: string | undefined, role: UserRole | undefined) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
        shipments: {
          include: {
            events: { orderBy: { occurredAt: "desc" } },
          },
        },
        statusEvents: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (role !== UserRole.ADMIN && order.userId && order.userId !== userId) {
      throw new AppError("Cannot access another user's order.", 403, "FORBIDDEN");
    }

    return order;
  }

  static async updateOrderStatus(orderId: string, adminUserId: string, input: UpdateOrderStatusInput) {
    await this.getOrderById(orderId, adminUserId, UserRole.ADMIN);

    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const updateData: {
        status: UpdateOrderStatusInput["status"];
        shipmentStatus?: ShipmentStatus;
      } = {
        status: input.status,
      };

      if (input.status === OrderStatus.OUT_FOR_DELIVERY) {
        updateData.shipmentStatus = ShipmentStatus.SHIPPED;
      }

      if (input.status === OrderStatus.DELIVERED) {
        updateData.shipmentStatus = ShipmentStatus.DELIVERED;
      }

      const order = await db.order.update({
        where: { id: orderId },
        data: updateData,
      });

      await db.orderStatusEvent.create({
        data: {
          orderId,
          status: input.status,
          note: input.note,
          createdById: adminUserId,
        },
      });

      return order;
    });
  }
}
