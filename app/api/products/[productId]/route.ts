import { NextRequest } from "next/server";
import { ProductController } from "@/server/controllers/product.controller";

type RouteParams = {
  params: Promise<{ productId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { productId } = await params;
  return ProductController.getById(request, productId);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { productId } = await params;
  return ProductController.update(request, productId);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { productId } = await params;
  return ProductController.remove(request, productId);
}
