import { NextRequest } from "next/server";
import { OrderController } from "@/server/controllers/order.controller";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { orderId } = await params;
  return OrderController.updateStatus(request, orderId);
}
