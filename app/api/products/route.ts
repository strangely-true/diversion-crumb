import { NextRequest } from "next/server";
import { ProductController } from "@/server/controllers/product.controller";

export async function GET(request: NextRequest) {
  return ProductController.list(request);
}

export async function POST(request: NextRequest) {
  return ProductController.create(request);
}
