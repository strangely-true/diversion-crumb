import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getOptionalSession } from "@/server/auth/auth";
import { withErrorHandling } from "@/server/errors/handle-error";
import {
  adjustInventorySchema,
  createProductSchema,
  parseListProductsQuery,
  updateProductSchema,
} from "@/server/validation/product.schemas";
import { ProductService } from "@/server/services/product.service";

export class ProductController {
  static async list(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await getOptionalSession(request);
      const isAdmin = session?.role === "ADMIN";
      const query = parseListProductsQuery(request.nextUrl.searchParams);

      const data = await ProductService.listProducts(query, isAdmin);
      return NextResponse.json(data);
    });
  }

  static async getById(request: NextRequest, productId: string) {
    return withErrorHandling(async () => {
      const session = await getOptionalSession(request);
      const isAdmin = session?.role === "ADMIN";

      const data = await ProductService.getProductById(productId, isAdmin);
      return NextResponse.json(data);
    });
  }

  static async create(request: NextRequest) {
    return withErrorHandling(async () => {
      const session = await requireAdmin(request);
      const payload = createProductSchema.parse(await request.json());

      const data = await ProductService.createProduct(payload, session.userId);
      return NextResponse.json(data, { status: 201 });
    });
  }

  static async update(request: NextRequest, productId: string) {
    return withErrorHandling(async () => {
      await requireAdmin(request);
      const payload = updateProductSchema.parse(await request.json());

      const data = await ProductService.updateProduct(productId, payload);
      return NextResponse.json(data);
    });
  }

  static async remove(request: NextRequest, productId: string) {
    return withErrorHandling(async () => {
      await requireAdmin(request);

      const data = await ProductService.deleteProduct(productId);
      return NextResponse.json(data);
    });
  }

  static async adjustInventory(request: NextRequest, variantId: string) {
    return withErrorHandling(async () => {
      const session = await requireAdmin(request);
      const payload = adjustInventorySchema.parse(await request.json());

      const data = await ProductService.adjustInventory(variantId, payload, session.userId);
      return NextResponse.json(data);
    });
  }
}
