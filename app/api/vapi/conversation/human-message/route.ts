import { NextRequest, NextResponse } from "next/server";
import { ConversationService } from "@/server/services/conversation.service";
import { MessageRole, AgentType } from "@/generated/prisma/enums";

/**
 * POST /api/vapi/conversation/human-message
 * 
 * Client (in escalated mode) sends a text message to the conversation.
 * Body: { sessionId: string, content: string }
 */
export async function POST(req: NextRequest) {
    try {
        const { sessionId, content } = (await req.json()) as {
            sessionId?: string;
            content?: string;
        };

        if (!sessionId) {
            return NextResponse.json(
                { error: "sessionId required" },
                { status: 400 }
            );
        }

        if (!content || typeof content !== "string" || !content.trim()) {
            return NextResponse.json(
                { error: "content required and must be non-empty" },
                { status: 400 }
            );
        }

        // Get conversation by sessionId
        const conversation = await ConversationService.getBySessionId(sessionId);
        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // Add client message to conversation
        const message = await ConversationService.addMessage(conversation.id, {
            role: MessageRole.USER,
            content: content.trim(),
            agentType: AgentType.HUMAN,
        });

        return NextResponse.json(message);
    } catch (err) {
        console.error("[vapi/conversation/human-message] error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
