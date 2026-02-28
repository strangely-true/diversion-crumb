import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/auth";
import { withErrorHandling } from "@/server/errors/handle-error";
import { processPaymentSchema } from "@/server/validation/payment.schemas";
import { PaymentService } from "@/server/services/payment.service";

export class PaymentController {
  static async process(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await requireAuth(request);
      const payload = processPaymentSchema.parse(await request.json());

      const data = await PaymentService.processPayment(payload, session.userId, session.role);
      return NextResponse.json(data);
    });
  }
}
