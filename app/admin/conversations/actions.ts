"use server";

import { revalidatePath } from "next/cache";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { AgentType, ConversationStatus, MessageRole } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/auth";
import { ConversationService } from "@/server/services/conversation.service";

const insightsSchema = z.object({
  summary: z.string().trim().min(20).max(1200),
  suggestedReplies: z.array(z.string().trim().min(8).max(220)).min(3).max(4),
});

type ConversationInsight = {
  summary: string;
  suggestedReplies: string[];
  generatedAt: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function buildConversationTranscript(
  messages: Array<{ role: string; agentType: string; content: string; createdAt: Date }>,
) {
  return messages
    .slice(-80)
    .map(
      (message) =>
        `[${message.createdAt.toISOString()}] role=${message.role} agent=${message.agentType}\n${message.content}`,
    )
    .join("\n\n");
}

export async function summarizeConversationAction(formData: FormData) {
  try {
    await requireAdmin();
    const conversationId = String(formData.get("conversationId") ?? "").trim();
    if (!conversationId) return;

    const conversation = await ConversationService.getById(conversationId);
    if (!conversation || conversation.messages.length === 0) return;

    const transcript = buildConversationTranscript(conversation.messages);
    let aiInsight: ConversationInsight;

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      aiInsight = {
        summary:
          "AI summary unavailable: GOOGLE_GENERATIVE_AI_API_KEY is not configured. Add the key to enable Gemini-powered chat summaries.",
        suggestedReplies: [
          "Thanks for waiting — I’m reviewing your conversation details now.",
          "I can help with this right away. Could you confirm your preferred resolution?",
          "I’ve noted your request and I’m taking ownership of this conversation.",
        ],
        generatedAt: new Date().toISOString(),
      };
    } else {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: insightsSchema,
        prompt: [
          "You are an expert support operations assistant for an ecommerce bakery.",
          "Generate a concise admin-facing conversation summary and exactly 3-4 suggested responses.",
          "Focus on customer intent, blockers, sentiment, unresolved asks, and concrete next best replies.",
          "Do not include markdown bullets in summary text.",
          "Conversation transcript:",
          transcript,
        ].join("\n"),
      });

      aiInsight = {
        summary: object.summary,
        suggestedReplies: object.suggestedReplies,
        generatedAt: new Date().toISOString(),
      };
    }

    const currentMetadata = asRecord(conversation.metadata) ?? {};

    await ConversationService.patch(conversationId, {
      metadata: {
        ...currentMetadata,
        aiInsight,
      },
    });

    revalidatePath("/admin/conversations");
  } catch (error) {
    console.error("[admin/conversations] summarizeConversationAction", error);
  }
}

export async function closeConversationAction(formData: FormData) {
  try {
    const session = await requireAdmin();
    const conversationId = String(formData.get("conversationId") ?? "").trim();
    if (!conversationId) return;

    const conversation = await ConversationService.getById(conversationId);
    const currentMetadata = asRecord(conversation?.metadata) ?? {};
    await ConversationService.patch(conversationId, {
      status: ConversationStatus.RESOLVED,
      metadata: {
        ...currentMetadata,
        closedAt: new Date().toISOString(),
        closedBy: session.email,
        autoDeleteAfterDays: 5,
      },
    });

    await ConversationService.addMessage(conversationId, {
      role: MessageRole.SYSTEM,
      content: `Conversation closed by admin ${session.email}.`,
      agentType: AgentType.HUMAN,
    });

    revalidatePath("/admin/conversations");
  } catch (error) {
    console.error("[admin/conversations] closeConversationAction", error);
  }
}

export async function deleteConversationAction(formData: FormData) {
  try {
    await requireAdmin();
    const conversationId = String(formData.get("conversationId") ?? "").trim();
    if (!conversationId) return;

    await ConversationService.delete(conversationId);
    revalidatePath("/admin/conversations");
  } catch (error) {
    console.error("[admin/conversations] deleteConversationAction", error);
  }
}

export async function takeOverConversationAction(formData: FormData) {
  try {
    const session = await requireAdmin();
    const conversationId = String(formData.get("conversationId") ?? "").trim();

    if (!conversationId) return;

    await ConversationService.patch(conversationId, {
      status: ConversationStatus.OPEN,
      assignedToId: session.userId,
      metadata: { takeoverAt: new Date().toISOString(), takeoverBy: session.email },
    });

    await ConversationService.addMessage(conversationId, {
      role: MessageRole.SYSTEM,
      content: `Admin ${session.email} took over this conversation.`,
      agentType: AgentType.HUMAN,
    });

    revalidatePath("/admin/conversations");
  } catch (error) {
    console.error("[admin/conversations] takeOverConversationAction", error);
  }
}

export async function sendAdminReplyAction(formData: FormData) {
  try {
    const session = await requireAdmin();
    const conversationId = String(formData.get("conversationId") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (!conversationId || !content) return;

    await ConversationService.patch(conversationId, {
      status: ConversationStatus.OPEN,
      assignedToId: session.userId,
    });

    await ConversationService.addMessage(conversationId, {
      role: MessageRole.ASSISTANT,
      content,
      agentType: AgentType.HUMAN,
      metadata: { sentByAdminId: session.userId, sentByAdminEmail: session.email },
    });

    revalidatePath("/admin/conversations");
  } catch (error) {
    console.error("[admin/conversations] sendAdminReplyAction", error);
  }
}

export async function approveDiscountAction(formData: FormData) {
  try {
    const session = await requireAdmin();
    const conversationId = String(formData.get("conversationId") ?? "").trim();
    const approvedDiscountPercent = Number(formData.get("approvedDiscountPercent") ?? 0);

    if (!conversationId || approvedDiscountPercent < 0 || approvedDiscountPercent > 100) {
      return;
    }

    const conversation = await ConversationService.getById(conversationId);
    if (!conversation) return;

    const currentMetadata = asRecord(conversation.metadata) ?? {};

    await ConversationService.patch(conversationId, {
      metadata: {
        ...currentMetadata,
        approvedDiscountPercent,
        discountApprovedAt: new Date().toISOString(),
        discountApprovedBy: session.email,
      },
    });

    // Optionally log approval as a system message
    await ConversationService.addMessage(conversationId, {
      role: MessageRole.SYSTEM,
      content: `Admin ${session.email} approved ${approvedDiscountPercent}% discount for this order.`,
      agentType: AgentType.HUMAN,
      metadata: {
        approvalType: "discount",
        approvedPercent: approvedDiscountPercent,
        approvedBy: session.userId,
      },
    });

    revalidatePath("/admin/conversations");
  } catch (error) {
    console.error("[admin/conversations] approveDiscountAction", error);
  }
}
