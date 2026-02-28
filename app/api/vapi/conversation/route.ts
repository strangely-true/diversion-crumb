import { NextRequest, NextResponse } from "next/server";
import { ConversationService } from "@/server/services/conversation.service";
import { getOptionalSession } from "@/server/auth/auth";

/** GET /api/vapi/conversation?sessionId=... – fetch conversation by sessionId */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 },
      );
    }

    const conversation = await ConversationService.getBySessionId(sessionId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(conversation);
  } catch (err) {
    console.error("[vapi/conversation] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** POST /api/vapi/conversation  – create or get a conversation by sessionId */
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 },
      );
    }

    const session = await getOptionalSession();
    const userId = session?.userId ?? undefined;

    const conversation = await ConversationService.getOrCreate(
      sessionId,
      userId,
    );
    return NextResponse.json(conversation);
  } catch (err) {
    console.error("[vapi/conversation]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
