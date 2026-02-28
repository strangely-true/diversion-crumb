import { NextRequest, NextResponse } from "next/server";
import { ConversationService } from "@/server/services/conversation.service";
import { requireAdmin } from "@/server/auth/auth";

/**
 * POST /api/admin/conversation/approve-discount
 * 
 * Admin sets the approved discount percentage for a conversation.
 * Body: { conversationId: string, approvedDiscountPercent: number }
 */
export async function POST(req: NextRequest) {
    try {
        await requireAdmin();

        const { conversationId, approvedDiscountPercent } = (await req.json()) as {
            conversationId?: string;
            approvedDiscountPercent?: number;
        };

        if (!conversationId) {
            return NextResponse.json(
                { error: "conversationId is required" },
                { status: 400 }
            );
        }

        if (
            typeof approvedDiscountPercent !== "number" ||
            approvedDiscountPercent < 0 ||
            approvedDiscountPercent > 100
        ) {
            return NextResponse.json(
                { error: "approvedDiscountPercent must be a number between 0 and 100" },
                { status: 400 }
            );
        }

        // Fetch current conversation to preserve metadata
        const conversation = await ConversationService.getById(conversationId);
        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // Update metadata with approved discount
        const updatedMetadata = {
            ...(typeof conversation.metadata === "object" ? conversation.metadata : {}),
            approvedDiscountPercent,
            discountApprovedAt: new Date().toISOString(),
        };

        const updated = await ConversationService.patch(conversationId, {
            metadata: updatedMetadata,
        });

        return NextResponse.json({
            success: true,
            conversation: updated,
            approvedDiscountPercent,
        });
    } catch (err) {
        console.error("[admin/conversation/approve-discount] error:", err);
        if (err instanceof Error && err.message.includes("Unauthorized")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
