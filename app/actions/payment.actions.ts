"use server";

import { PaymentService } from "@/server/services/payment.service";
import { processPaymentSchema } from "@/server/validation/payment.schemas";

export async function processPaymentAction(input: unknown, userId?: string) {
  const payload = processPaymentSchema.parse(input);
  return PaymentService.processPayment(payload, userId);
}
