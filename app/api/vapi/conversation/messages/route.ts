/**
 * POST /api/vapi/conversation/messages
 *
 * Fire-and-forget endpoint to batch-persist conversation messages without
 * blocking the voice interaction.  The client calls this without awaiting.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { MessageRole, AgentType } from "@/generated/prisma/enums";

interface SaveMessageInput {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId: string;
      messages: SaveMessageInput[];
    };

    const { sessionId, messages } = body;

    if (!sessionId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ saved: 0 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { sessionId },
      select: { id: true },
    });

    // Conversation may not exist yet (race condition on first message) — silently succeed
    if (!conversation) {
      return NextResponse.json({ saved: 0 });
    }

    await prisma.conversationMessage.createMany({
      data: messages.map((m) => ({
        conversationId: conversation.id,
        role: m.role === "user" ? MessageRole.USER : MessageRole.ASSISTANT,
        content: m.content,
        agentType: AgentType.AI,
      })),
    });

    // Bump conversation.updatedAt so the admin dashboard shows recent activity
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ saved: messages.length });
  } catch (err) {
    // Non-critical — never crash the voice call over a persistence failure
    console.error("[conversation/messages]", err);
    return NextResponse.json({ saved: 0 });
  }
}
