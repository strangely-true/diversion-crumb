import { NextRequest } from "next/server";
import { CartController } from "@/server/controllers/cart.controller";

export async function GET(request: NextRequest) {
  return CartController.getCart(request);
}
