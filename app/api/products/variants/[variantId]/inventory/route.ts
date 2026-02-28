import { NextRequest } from "next/server";
import { ProductController } from "@/server/controllers/product.controller";

type RouteParams = {
  params: Promise<{ variantId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { variantId } = await params;
  return ProductController.adjustInventory(request, variantId);
}
