import { revalidatePath } from "next/cache";
import { AgentType, ConversationStatus, MessageRole } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/auth";
import { AdminService } from "@/server/services/admin.service";
import { ConversationService } from "@/server/services/conversation.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getEscalationReason(messages: Array<{ role: string; content: string }>) {
  const escalationMessage = [...messages]
    .reverse()
    .find(
      (message) =>
        message.role === MessageRole.SYSTEM &&
        message.content.startsWith("Escalated to human. Reason:"),
    );

  if (!escalationMessage) return null;
  return escalationMessage.content.replace("Escalated to human. Reason:", "").trim();
}

async function takeOverConversationAction(formData: FormData) {
  "use server";

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
}

async function sendAdminReplyAction(formData: FormData) {
  "use server";

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
}

export default async function AdminConversationsPage() {
  const session = await requireAdmin();
  const conversations = await AdminService.getConversations();
  const escalatedPending = conversations.filter(
    (conversation) =>
      conversation.status === ConversationStatus.ESCALATED && !conversation.assignedToId,
  );

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Conversations</h1>
        <p className="text-muted-foreground text-sm">All user conversations with the agent.</p>
      </div>

      {escalatedPending.length > 0 && (
        <Alert>
          <AlertTitle>
            {escalatedPending.length} escalated conversation{escalatedPending.length > 1 ? "s" : ""} need admin attention
          </AlertTitle>
          <AlertDescription>
            The AI flagged these chats for human help. Any admin can click Take Over and continue the conversation.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversation Log</CardTitle>
          <CardDescription>Expandable conversation details and message history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversations.map((conversation) => (
            <details key={conversation.id} className="border-border rounded-md border p-3">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                <Badge variant="outline">{conversation.status}</Badge>
                {conversation.status === ConversationStatus.ESCALATED && (
                  <Badge variant="destructive">Needs Human</Badge>
                )}
                <span className="font-medium">{conversation.user?.email ?? "Guest user"}</span>
                <span className="text-muted-foreground">{conversation.messages.length} messages</span>
                <span className="text-muted-foreground">Updated {formatDate(conversation.updatedAt)}</span>
              </summary>
              <div className="mt-3 space-y-2">
                {conversation.status === ConversationStatus.ESCALATED && (
                  <div className="bg-muted/30 rounded-md border p-2 text-sm">
                    <p className="font-medium">Escalation notice</p>
                    <p className="text-muted-foreground text-xs">
                      {getEscalationReason(conversation.messages) ??
                        "The AI requested human takeover for this conversation."}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {conversation.assignedTo
                          ? `Assigned to ${conversation.assignedTo.email}`
                          : "Unassigned"}
                      </Badge>
                      {conversation.assignedToId !== session.userId && (
                        <form action={takeOverConversationAction}>
                          <input type="hidden" name="conversationId" value={conversation.id} />
                          <Button type="submit" size="sm">
                            Take Over
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {conversation.messages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No messages.</p>
                ) : (
                  conversation.messages.map((message) => (
                    <div key={message.id} className="bg-muted/40 rounded-md px-3 py-2 text-sm">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="secondary">{message.role}</Badge>
                        <Badge variant="outline">{message.agentType}</Badge>
                        <span className="text-muted-foreground text-xs">{formatDate(message.createdAt)}</span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  ))
                )}

                <form action={sendAdminReplyAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="conversationId" value={conversation.id} />
                  <textarea
                    name="content"
                    rows={2}
                    className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    placeholder="Reply as admin and continue this chat..."
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" variant="outline">
                      Send as Human Agent
                    </Button>
                  </div>
                </form>
              </div>
            </details>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}