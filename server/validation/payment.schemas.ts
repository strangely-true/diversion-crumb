import { PaymentMethod } from "@/generated/prisma/enums";
import { z } from "zod";

export const processPaymentSchema = z.object({
  orderId: z.uuid(),
  method: z.enum(PaymentMethod),
  amount: z.number().positive().optional(),
  forceResult: z.enum(["success", "failure"]).optional(),
});
