"use server";

import { PaymentService } from "@/server/services/payment.service";
import { processPaymentSchema } from "@/server/validation/payment.schemas";
import { UserRole } from "@/generated/prisma/enums";

export async function processPaymentAction(input: unknown, userId?: string, role?: UserRole) {
  const payload = processPaymentSchema.parse(input);
  if (!userId || !role) {
    throw new Error("User ID and role are required");
  }
  return PaymentService.processPayment(payload, userId, role);
}
