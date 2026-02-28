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
import { listProductsQuerySchema } from "@/server/validation/product.schemas";
import { MessageRole, AgentType } from "@/generated/prisma/enums";

// Optional shared secret (set VAPI_WEBHOOK_SECRET in .env to enable verification)
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET;

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

interface VapiToolCallsPayload {
  message: {
    type: string;
    toolCallList?: ToolCall[];
    toolWithToolCallList?: Array<{
      id?: string;
      type?: string;
      toolCall: ToolCall;
    }>;
  };
  call?: { id?: string };
}

type NormalizedToolCall = {
  toolCallId: string;
  name?: string;
  argumentsJson?: string;
  error?: string;
};

function normalizeToolCalls(payload: VapiToolCallsPayload): NormalizedToolCall[] {
  const directList = payload.message?.toolCallList ?? [];
  const nestedList = (payload.message?.toolWithToolCallList ?? []).map(
    (item) => item.toolCall,
  );

  const combined = [...directList, ...nestedList];

  return combined.map((call, index) => {
    const fallbackId = `missing-id-${index + 1}`;
    const toolCallId = String(call?.id ?? fallbackId);
    const name = call?.function?.name;
    const argumentsJson = call?.function?.arguments;

    if (!call?.id) {
      return {
        toolCallId,
        error: "Malformed tool call: missing id",
      };
    }

    if (!name) {
      return {
        toolCallId,
        error: "Malformed tool call: missing function.name",
      };
    }

    return {
      toolCallId,
      name,
      argumentsJson,
    };
  });
}

export async function POST(req: NextRequest) {
  let rawBody: unknown;

  try {
    // Optional secret verification
    if (WEBHOOK_SECRET) {
      const secret = req.headers.get("x-vapi-secret");
      if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    rawBody = await req.json();
    console.log("[vapi/tools] incoming payload:", JSON.stringify(rawBody, null, 2));

    const body = rawBody as VapiToolCallsPayload;

    // Normalise both payload shapes Vapi may send
    const toolCalls = normalizeToolCalls(body);

    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await Promise.all(
      toolCalls.map(async (call) => {
        if (call.error || !call.name) {
          return {
            toolCallId: call.toolCallId,
            result: JSON.stringify({
              error: call.error ?? "Malformed tool call",
            }),
          };
        }

        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.argumentsJson ?? "{}");
        } catch {
          // empty args
        }

        let result: unknown;

        try {
          result = await executeToolCall(call.name, args);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Tool call failed";
          result = { error: msg };
        }

        return {
          toolCallId: call.toolCallId,
          result: typeof result === "string" ? result : JSON.stringify(result),
        };
      }),
    );

    return NextResponse.json({ results });
  } catch (err) {
    if (rawBody) {
      console.log("[vapi/tools] payload on error:", JSON.stringify(rawBody, null, 2));
    }
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
): Promise<unknown> {
  switch (name) {
    // ── listProducts ────────────────────────────────────────────────────────
    case "listProducts": {
      const query = listProductsQuerySchema.parse({
        page: 1,
        pageSize: args.pageSize ?? 6,
        categorySlug: args.category,
        search: args.search,
      });
      const { items } = await ProductService.listProducts(query, false);

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
      const p = await ProductService.getProductBySlug(slug);

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

    default:
      return `Unknown tool: ${name}`;
  }
}
