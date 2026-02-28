import { NextRequest, NextResponse } from "next/server";
import { ConversationService } from "@/server/services/conversation.service";

/**
 * GET /api/vapi/conversation/approved-discount?sessionId=...
 * 
 * Client fetches the admin-approved discount percentage for this conversation.
 */
export async function GET(req: NextRequest) {
    try {
        const sessionId = req.nextUrl.searchParams.get("sessionId");
        if (!sessionId) {
            return NextResponse.json(
                { error: "sessionId is required" },
                { status: 400 }
            );
        }

        const conversation = await ConversationService.getBySessionId(sessionId);
        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const metadata =
            typeof conversation.metadata === "object"
                ? (conversation.metadata as Record<string, unknown>)
                : {};

        const approvedDiscountPercent =
            typeof metadata.approvedDiscountPercent === "number"
                ? metadata.approvedDiscountPercent
                : null;

        return NextResponse.json({
            approvedDiscountPercent,
            conversationId: conversation.id,
            conversationStatus: conversation.status,
        });
    } catch (err) {
        console.error("[vapi/conversation/approved-discount] error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
