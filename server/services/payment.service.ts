import { OrderStatus, PaymentStatus, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";
import { AppError } from "@/server/errors/app-error";
import { processPaymentSchema } from "@/server/validation/payment.schemas";

type ProcessPaymentInput = ReturnType<typeof processPaymentSchema.parse>;

function resolvePaymentSuccess(forceResult?: "success" | "failure") {
  if (forceResult === "success") {
    return true;
  }

  if (forceResult === "failure") {
    return false;
  }

  return Math.random() > 0.15;
}

export class PaymentService {
  static async processPayment(input: ProcessPaymentInput, userId: string, role: UserRole) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (role !== UserRole.ADMIN && order.userId !== userId) {
      throw new AppError("Cannot process payment for another user's order.", 403, "FORBIDDEN");
    }

    const orderTotal = Number(order.total);
    const amount = input.amount ?? orderTotal;
    if (Math.abs(amount - orderTotal) > 0.01) {
      throw new AppError("Payment amount must match order total.", 400, "INVALID_PAYMENT_AMOUNT");
    }

    const isSuccess = resolvePaymentSuccess(input.forceResult);

    return prisma.$transaction(async (tx) => {
      const db = tx as typeof prisma;

      const payment = await db.payment.create({
        data: {
          orderId: order.id,
          provider: "mock-gateway",
          method: input.method,
          status: isSuccess ? PaymentStatus.CAPTURED : PaymentStatus.FAILED,
          amount,
          currency: order.currency,
          transactionId: `mock_txn_${Date.now()}`,
          metadata: {
            simulated: true,
            requestedBy: userId,
          },
          processedAt: new Date(),
        },
      });

      const orderStatus = isSuccess
        ? order.status === OrderStatus.PENDING
          ? OrderStatus.CONFIRMED
          : order.status
        : order.status;

      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isSuccess ? PaymentStatus.CAPTURED : PaymentStatus.FAILED,
          status: orderStatus,
        },
      });

      await db.orderStatusEvent.create({
        data: {
          orderId: order.id,
          status: orderStatus,
          note: isSuccess ? "Payment captured successfully." : "Payment failed.",
          createdById: userId,
        },
      });

      return {
        payment,
        paymentResult: isSuccess ? "success" : "failure",
      };
    });
  }
}
