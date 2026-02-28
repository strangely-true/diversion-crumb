import { google } from "@ai-sdk/google";
import {
  streamText,
  tool,
  stepCountIs,
  jsonSchema,
  type ModelMessage,
} from "ai";
import { type NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth/auth";
import { AdminService } from "@/server/services/admin.service";
import { OrderService } from "@/server/services/order.service";
import { AppError } from "@/server/errors/app-error";

export const maxDuration = 60;

// ─── Input types (used to type jsonSchema<T> and execute params) ───────────────

type UpdateUserRoleInput = { userId: string; role: "CUSTOMER" | "ADMIN" };
type DeleteUserInput = { userId: string };
type CreateProductInput = {
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  stock?: number;
  slug?: string;
  tags?: string[];
  servingSize?: string;
  ingredients?: string;
  allergens?: string[];
  nutritionPerServing?: {
    calories?: number;
    fatG?: number;
    saturatedFatG?: number;
    carbsG?: number;
    sugarG?: number;
    proteinG?: number;
    fiberG?: number;
    sodiumMg?: number;
  };
};
type DeleteProductInput = { productId: string };
type AdjustInventoryInput = { variantId: string; quantityDelta: number };
type UpdateOrderStatusInput = {
  orderId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "READY_FOR_PICKUP"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  note?: string;
};
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin(req);
  } catch (err) {
    const statusCode = err instanceof AppError ? err.statusCode : 401;
    const message = err instanceof AppError ? err.message : "Unauthorized";
    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = (await req.json()) as { messages: ModelMessage[] };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `You are an admin assistant for Crumbs & Co. bakery.
You have full access to admin tools for managing users, products, inventory, orders, and support conversations.

Guidelines:
- Always fetch fresh data using tools before answering questions about current state.
- For destructive actions (deleteUser, deleteProduct), confirm with the admin before executing unless they've clearly stated they want to proceed.
- Present tabular data as readable markdown tables when there are multiple rows.
- When creating products, always call getProductCategories first to resolve the correct categoryId.
- Be concise and direct. If an operation succeeds, confirm it briefly.
- If a tool returns an error, explain it clearly and suggest alternatives.

Today's date: ${today}
Acting admin: ${session.email} (ID: ${session.userId})`,
    messages,
    stopWhen: stepCountIs(8),
    tools: {
      getDashboardStats: tool({
        description:
          "Get an overview of key dashboard statistics: total users, products, orders, conversations, payments, and shipments.",
        inputSchema: jsonSchema<Record<string, never>>({
          type: "object",
          properties: {},
        }),
        execute: async () => AdminService.getDashboardStats(),
      }),

      listUsers: tool({
        description:
          "List all registered users with their roles, emails, and activity counts (orders, conversations).",
        inputSchema: jsonSchema<Record<string, never>>({
          type: "object",
          properties: {},
        }),
        execute: async () => AdminService.getUsers(),
      }),

      updateUserRole: tool({
        description: "Change a user's role to CUSTOMER or ADMIN.",
        inputSchema: jsonSchema<UpdateUserRoleInput>({
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "The ID of the user whose role should be changed.",
            },
            role: {
              type: "string",
              enum: ["CUSTOMER", "ADMIN"],
              description: "The new role to assign.",
            },
          },
          required: ["userId", "role"],
        }),
        execute: async ({ userId, role }: UpdateUserRoleInput) =>
          AdminService.updateUserRole(userId, role, session.userId),
      }),

      deleteUser: tool({
        description:
          "Permanently delete a user account and all related data. Irreversible. Cannot delete yourself or the last admin.",
        inputSchema: jsonSchema<DeleteUserInput>({
          type: "object",
          properties: {
            userId: {
              type: "string",
              description: "The ID of the user to permanently delete.",
            },
          },
          required: ["userId"],
        }),
        execute: async ({ userId }: DeleteUserInput) =>
          AdminService.deleteUser(userId, session.userId),
      }),

      listProducts: tool({
        description:
          "List all products in the catalog with categories, variants, pricing, and inventory levels.",
        inputSchema: jsonSchema<Record<string, never>>({
          type: "object",
          properties: {},
        }),
        execute: async () => AdminService.getProducts(),
      }),

      getProductCategories: tool({
        description:
          "Get all available product categories. Call this before creating a product to resolve the correct categoryId.",
        inputSchema: jsonSchema<Record<string, never>>({
          type: "object",
          properties: {},
        }),
        execute: async () => AdminService.getProductCategories(),
      }),

      createProduct: tool({
        description:
          "Create a new bakery product in the catalog. Call getProductCategories first to get a valid categoryId.",
        inputSchema: jsonSchema<CreateProductInput>({
          type: "object",
          properties: {
            name: { type: "string", description: "Product display name." },
            description: {
              type: "string",
              description: "Short product description (max 220 chars).",
            },
            categoryId: {
              type: "string",
              description: "ID of the category (from getProductCategories).",
            },
            price: { type: "number", description: "Price in USD." },
            stock: {
              type: "number",
              description: "Initial stock quantity (default 0).",
            },
            slug: {
              type: "string",
              description: "URL slug (auto-generated from name if omitted).",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Up to 6 searchable tags.",
            },
            servingSize: {
              type: "string",
              description: "e.g. '1 slice (80g)'",
            },
            ingredients: {
              type: "string",
              description: "Comma-separated ingredients.",
            },
            allergens: {
              type: "array",
              items: { type: "string" },
              description: "Allergen list.",
            },
            nutritionPerServing: {
              type: "object",
              description: "Nutrition facts per serving.",
              properties: {
                calories: { type: "number" },
                fatG: { type: "number" },
                saturatedFatG: { type: "number" },
                carbsG: { type: "number" },
                sugarG: { type: "number" },
                proteinG: { type: "number" },
                fiberG: { type: "number" },
                sodiumMg: { type: "number" },
              },
            },
          },
          required: ["name", "categoryId", "price"],
        }),
        execute: async (input: CreateProductInput) =>
          AdminService.createQuickProduct(input, session.userId),
      }),

      deleteProduct: tool({
        description:
          "Permanently remove a product from the catalog. Irreversible.",
        inputSchema: jsonSchema<DeleteProductInput>({
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "The ID of the product to delete.",
            },
          },
          required: ["productId"],
        }),
        execute: async ({ productId }: DeleteProductInput) =>
          AdminService.removeProduct(productId),
      }),

      listInventory: tool({
        description:
          "Get current stock levels for all product variants across the catalog.",
        inputSchema: jsonSchema<Record<string, never>>({
          type: "object",
          properties: {},
        }),
        execute: async () => AdminService.getInventoryItems(),
      }),

      adjustInventory: tool({
        description:
          "Adjust the stock quantity of a specific product variant. Positive delta to restock, negative to reduce.",
        inputSchema: jsonSchema<AdjustInventoryInput>({
          type: "object",
          properties: {
            variantId: {
              type: "string",
              description: "The ID of the product variant to adjust.",
            },
            quantityDelta: {
              type: "number",
              description:
                "Amount to change stock by. Positive to add, negative to subtract.",
            },
          },
          required: ["variantId", "quantityDelta"],
        }),
        execute: async ({ variantId, quantityDelta }: AdjustInventoryInput) =>
          AdminService.adjustVariantInventory(
            variantId,
            quantityDelta,
            session.userId,
          ),
      }),

      listOrders: tool({
        description:
          "List all orders with customer info, payment status, shipment status, and order totals.",
        inputSchema: jsonSchema<Record<string, never>>({
          type: "object",
          properties: {},
        }),
        execute: async () => AdminService.getShippingAndPayments(),
      }),

      updateOrderStatus: tool({
        description: "Update the fulfillment status of an order.",
        inputSchema: jsonSchema<UpdateOrderStatusInput>({
          type: "object",
          properties: {
            orderId: {
              type: "string",
              description: "The ID of the order to update.",
            },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "CONFIRMED",
                "PREPARING",
                "READY_FOR_PICKUP",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
                "REFUNDED",
              ],
              description: "The new order status.",
            },
            note: {
              type: "string",
              description: "Optional admin note about the status change.",
            },
          },
          required: ["orderId", "status"],
        }),
        execute: async ({ orderId, status, note }: UpdateOrderStatusInput) =>
          OrderService.updateOrderStatus(orderId, session.userId, {
            status,
            note,
          }),
      }),

      listConversations: tool({
        description:
          "Get all customer support conversations with their full message history, user info, and assignment status.",
        inputSchema: jsonSchema<Record<string, never>>({
          type: "object",
          properties: {},
        }),
        execute: async () => AdminService.getConversations(),
      }),
    },
  });

  return result.toTextStreamResponse();
}
