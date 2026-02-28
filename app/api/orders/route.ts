import { NextRequest } from "next/server";
import { OrderController } from "@/server/controllers/order.controller";

export async function GET(request: NextRequest) {
  return OrderController.listMine(request);
}

export async function POST(request: NextRequest) {
  return OrderController.createFromCart(request);
}
