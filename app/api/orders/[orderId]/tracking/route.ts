import { NextRequest } from "next/server";
import { OrderController } from "@/server/controllers/order.controller";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { orderId } = await params;
  return OrderController.getById(request, orderId);
}
