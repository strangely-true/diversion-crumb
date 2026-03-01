/**
 * POST /api/vapi/tools
 *
 * Vapi webhook endpoint for server-side tool calls.
 * Vapi sends a POST here when the AI wants to invoke a server tool.
 *
 * Expected body (Vapi tool-calls webhook):
 * {
 *   message: {
 *     type: "tool-calls",
 *     toolCallList: [{ id, type, function: { name, arguments } }]
 *   },
 *   call: { id: vapiCallId, ... }
 * }
 *
 * Expected response:
 * { results: [{ toolCallId, result }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/server/services/product.service";
import { KnowledgeService } from "@/server/services/knowledge.service";
import { ConversationService } from "@/server/services/conversation.service";
import { NotificationService } from "@/server/services/notification.service";
import { CartService } from "@/server/services/cart.service";
import { prisma } from "@/server/prisma/client";
import { listProductsQuerySchema } from "@/server/validation/product.schemas";
import { MessageRole, AgentType } from "@/generated/prisma/enums";

// Optional shared secret (set VAPI_WEBHOOK_SECRET in .env to enable verification)
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET;

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    // VAPI may send arguments as a JSON string OR a pre-parsed object
    arguments: string | Record<string, unknown>;
  };
}

interface VapiToolCallsPayload {
  message: {
    type: string;
    toolCallList?: ToolCall[];
  };
}

/** Safely extract args regardless of whether VAPI sent a string or object. */
function parseToolArgs(
  raw: string | Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function resolveVariantIdFromToolArgs(args: Record<string, unknown>) {
  const variantId = String(args.variantId ?? "").trim();
  if (variantId) {
    return variantId;
  }

  const productIdLike = String(args.productId ?? args.id ?? "").trim();
  if (productIdLike) {
    try {
      const product = await ProductService.getProductById(productIdLike, false);
      const activeVariant = product.variants.find(
        (variant) => variant.isActive,
      );
      if (activeVariant) {
        return activeVariant.id;
      }
      return null;
    } catch {
      return productIdLike;
    }
  }

  const slug = String(args.slug ?? args.productSlug ?? "").trim();
  if (slug) {
    try {
      const product = await ProductService.getProductBySlugDirect(slug, false);
      const activeVariant = product.variants.find(
        (variant) => variant.isActive,
      );
      return activeVariant?.id ?? null;
    } catch {
      return null;
    }
  }

  return "";
}

export async function POST(req: NextRequest) {
  try {
    // Optional secret verification
    if (WEBHOOK_SECRET) {
      const secret = req.headers.get("x-vapi-secret");
      if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Identity comes from query params set by the client when the call starts
    const userId = req.nextUrl.searchParams.get("userId") || undefined;
    const sessionId = req.nextUrl.searchParams.get("sessionId") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: VapiToolCallsPayload & Record<string, any> = await req.json();

    const toolCalls: ToolCall[] = body.message?.toolCallList ?? [];

    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await Promise.all(
      toolCalls.map(async (call) => {
        const name = call.function.name;
        const args = parseToolArgs(call.function.arguments);

        let result: unknown;

        try {
          result = await executeToolCall(name, args, userId, sessionId);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Tool call failed";
          result = { error: msg };
        }

        return {
          toolCallId: call.id,
          result: JSON.stringify(result),
        };
      }),
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[vapi/tools] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Tool Implementations ───────────────────────────────────────────────────────

async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  userId?: string,
  sessionId?: string,
): Promise<unknown> {
  // Use sessionId from the client for guest carts; userId for authenticated users
  const cartSessionId = sessionId ?? "vapi_guest";

  switch (name) {
    // ── addToCart ───────────────────────────────────────────────────────────
    case "addToCart": {
      const variantId = await resolveVariantIdFromToolArgs(args);
      const quantity = Number(args.quantity ?? 1);

      if (!variantId) {
        return { error: "variantId is required (or provide productId/slug)." };
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { error: "Invalid quantity" };
      }

      try {
        const cart = await CartService.addItem(userId, {
          sessionId: cartSessionId,
          currency: "USD",
          variantId,
          quantity,
        });
        return {
          success: true,
          totalItems: cart.summary.itemCount,
          subtotal: cart.summary.subtotal,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tool call failed";
        return { error: message };
      }
    }

    // ── updateCartItemQuantity ──────────────────────────────────────────────
    case "updateCartItemQuantity": {
      const variantId = await resolveVariantIdFromToolArgs(args);
      const quantity = Number(args.quantity ?? 0);

      if (!variantId) {
        return { error: "variantId is required (or provide productId/slug)." };
      }
      if (!Number.isInteger(quantity) || quantity < 0) {
        return { error: "Invalid quantity" };
      }

      try {
        const cart = await CartService.getOrCreateActiveCart(
          userId,
          cartSessionId,
          "USD",
        );
        const existing = cart.items.find((i) => i.variantId === variantId);

        if (!existing && quantity > 0) {
          const added = await CartService.addItem(userId, {
            sessionId: cartSessionId,
            currency: "USD",
            variantId,
            quantity,
          });
          return {
            success: true,
            totalItems: added.summary.itemCount,
            subtotal: added.summary.subtotal,
          };
        }

        if (existing) {
          await CartService.updateItemQuantity(userId, existing.id, {
            quantity,
            sessionId: cartSessionId,
          });
        }

        const updated = await CartService.getOrCreateActiveCart(
          userId,
          cartSessionId,
          "USD",
        );
        return {
          success: true,
          totalItems: updated.summary.itemCount,
          subtotal: updated.summary.subtotal,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tool call failed";
        return { error: message };
      }
    }

    // ── getCart ──────────────────────────────────────────────────────────────
    case "getCart": {
      try {
        const cart = await CartService.getOrCreateActiveCart(
          userId,
          cartSessionId,
          "USD",
        );
        const items = cart.items.map((i) => ({
          name: i.variant.product.name,
          variant: i.variant.label,
          quantity: i.quantity,
          unitPrice: Number(i.variant.price),
          lineTotal: Number(i.variant.price) * i.quantity,
        }));
        return {
          totalItems: cart.summary.itemCount,
          subtotal: cart.summary.subtotal,
          items,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tool call failed";
        return { error: message };
      }
    }

    // ── listProducts ────────────────────────────────────────────────────────
    case "listProducts": {
      const query = listProductsQuerySchema.parse({
        page: 1,
        pageSize: args.pageSize ?? 6,
        categorySlug: args.category,
        search: args.search,
      });
      const { items } = await ProductService.listProductsDirect(query, false);

      return items.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category?.name,
        heroImage: p.heroImage,
        lowestPrice: p.variants
          .filter((v) => v.isActive)
          .map((v) => Number(v.price))
          .sort((a, b) => a - b)[0],
        variants: p.variants
          .filter((v) => v.isActive)
          .map((v) => ({ id: v.id, label: v.label, price: Number(v.price) })),
      }));
    }

    // ── getProduct ───────────────────────────────────────────────────────────
    case "getProduct": {
      const slug = String(args.slug ?? "");
      const p = await ProductService.getProductBySlugDirect(slug);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: p.category?.name,
        heroImage: p.heroImage,
        servingSize:
          (p as unknown as { servingSize?: string }).servingSize ?? null,
        ingredients:
          (p as unknown as { ingredients?: string }).ingredients ?? null,
        allergens: (p as unknown as { allergens?: string[] }).allergens ?? [],
        nutritionPerServing:
          (p as unknown as { nutritionPerServing?: unknown })
            .nutritionPerServing ?? null,
        variants: p.variants
          .filter((v) => v.isActive)
          .map((v) => ({
            id: v.id,
            label: v.label,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            currency: v.currency,
          })),
      };
    }

    // ── searchKnowledge ──────────────────────────────────────────────────────
    case "searchKnowledge": {
      const query = String(args.query ?? "");
      const entries = await KnowledgeService.search(query, 4);

      if (entries.length === 0) {
        return "No relevant information found in the knowledge base.";
      }

      return entries
        .map((e) => `**${e.title}**\n${e.content}`)
        .join("\n\n---\n\n");
    }

    // ── escalateToHuman ──────────────────────────────────────────────────────
    case "escalateToHuman": {
      const reason = String(args.reason ?? "Customer requested human support");
      const conversationId = args.conversationId
        ? String(args.conversationId)
        : null;

      if (conversationId) {
        await ConversationService.escalate(conversationId);
        await ConversationService.addMessage(conversationId, {
          role: MessageRole.SYSTEM,
          content: `Escalated to human. Reason: ${reason}`,
          agentType: AgentType.AI,
        });
      }

      // TODO: send email via Resend to support team
      return `Escalated to human support. Reason: ${reason}. A support agent will be with you shortly.`;
    }

    // ── requestSupervisorApproval ────────────────────────────────────────────
    case "requestSupervisorApproval": {
      const reason = String(args.reason ?? "Discount request");
      const requestedPercent = Number(args.requestedDiscountPercent ?? 0);
      let conversationId = args.conversationId
        ? String(args.conversationId)
        : null;

      // Business rule: supervisors approve max 20% discount
      const maxApproved = 20;
      const approvedPercent = Math.min(requestedPercent, maxApproved);

      if (requestedPercent > maxApproved) {
        if (!conversationId && sessionId) {
          const conversation = await ConversationService.getOrCreate(
            sessionId,
            userId,
          );
          conversationId = conversation.id;
        }

        if (conversationId) {
          const escalationReason = `Client requested ${requestedPercent}% discount, above allocated ${maxApproved}% policy limit.`;
          await ConversationService.escalate(conversationId);
          await ConversationService.addMessage(conversationId, {
            role: MessageRole.SYSTEM,
            content: `Escalated to human. Reason: ${escalationReason}`,
            agentType: AgentType.AI,
          });

          await NotificationService.notifyAllAdminsEscalation({
            conversationId,
            reason: escalationReason,
            requestedDiscountPercent: requestedPercent,
            allowedDiscountPercent: maxApproved,
          });
        }
      }

      // Small artificial pause — makes it feel like a real supervisor review
      await new Promise<void>((resolve) => setTimeout(resolve, 2500));

      const note =
        requestedPercent > maxApproved
          ? `The requested ${requestedPercent}% was above our policy limit, but ${approvedPercent}% has been approved. Your request has been escalated to a human admin for follow-up in chat.`
          : `${approvedPercent}% discount approved.`;

      return {
        approved: true,
        approvedDiscountPercent: approvedPercent,
        handoffRequired: requestedPercent > maxApproved,
        switchMode: requestedPercent > maxApproved ? "chat" : "voice",
        message: `Supervisor approved a ${approvedPercent}% discount on this order. ${note}`,
        supervisorNote: reason,
      };
    }

    // ── submitCustomCakeOrder ────────────────────────────────────────────────
    case "submitCustomCakeOrder": {
      const deliveryDate = String(args.deliveryDate ?? "").trim();
      const cakeDescription = String(args.cakeDescription ?? "").trim();
      let customerEmail = String(args.customerEmail ?? "").trim();
      let customerName: string | undefined;

      if (!deliveryDate) {
        return {
          error: "Please provide a delivery date for your custom cake order.",
        };
      }
      if (!cakeDescription) {
        return { error: "Please describe the cake you would like to order." };
      }

      // Resolve customer email from the authenticated session if not supplied
      if (!customerEmail && userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });
          customerEmail = user?.email ?? "";
          customerName = user?.name ?? undefined;
        } catch {
          // ignore lookup errors – we'll ask the customer for their email below
        }
      }

      if (!customerEmail) {
        return {
          error:
            "I couldn't find your email address. Could you please provide your email so we can confirm your order?",
        };
      }

      const emailResult =
        await NotificationService.sendCustomCakeOrderNotification({
          customerEmail,
          deliveryDate,
          cakeDescription,
          customerName,
        });

      if (!emailResult.success) {
        return {
          error:
            "We had trouble sending the order confirmation emails. Please try again or contact us directly.",
        };
      }

      return {
        success: true,
        message: `Your custom cake order has been received! A confirmation has been sent to ${customerEmail}. Our team will be in touch soon to confirm availability and pricing.`,
        orderSummary: {
          deliveryDate,
          cakeDescription,
          customerEmail,
        },
      };
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
