import { NextRequest } from "next/server";
import { CartController } from "@/server/controllers/cart.controller";

type RouteParams = {
  params: Promise<{ itemId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { itemId } = await params;
  return CartController.updateItem(request, itemId);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { itemId } = await params;
  return CartController.removeItem(request, itemId);
}
