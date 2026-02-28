import { NextRequest } from "next/server";
import { PaymentController } from "@/server/controllers/payment.controller";

export async function POST(request: NextRequest) {
  return PaymentController.process(request);
}
