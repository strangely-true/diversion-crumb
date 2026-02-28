import { NextRequest } from "next/server";
import { CartController } from "@/server/controllers/cart.controller";

export async function POST(request: NextRequest) {
  return CartController.addItem(request);
}
