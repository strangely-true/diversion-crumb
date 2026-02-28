import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ConversationStatus, MessageRole } from "@/generated/prisma/enums";
import { requireAdmin } from "@/server/auth/auth";
import { AdminService } from "@/server/services/admin.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  closeConversationAction,
  deleteConversationAction,
  sendAdminReplyAction,
  summarizeConversationAction,
  takeOverConversationAction,
} from "./actions";

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

function getConversationInsight(metadata: unknown): ConversationInsight | null {
  const root = asRecord(metadata);
  if (!root) return null;

  const insight = asRecord(root.aiInsight);
  if (!insight) return null;

  const parsed = insightsSchema.safeParse({
    summary: insight.summary,
    suggestedReplies: insight.suggestedReplies,
  });

  if (!parsed.success) return null;

  return {
    summary: parsed.data.summary,
    suggestedReplies: parsed.data.suggestedReplies,
    generatedAt: typeof insight.generatedAt === "string" ? insight.generatedAt : "",
  };
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
                {(() => {
                  const insight = getConversationInsight(conversation.metadata);
                  return (
                    <div className="bg-muted/20 rounded-md border p-3 text-sm">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">AI Chat Summary</p>
                        <div className="flex flex-wrap gap-2">
                          <form action={summarizeConversationAction}>
                            <input type="hidden" name="conversationId" value={conversation.id} />
                            <Button type="submit" size="sm" variant="outline">
                              {insight ? "Refresh Summary" : "Generate Summary"}
                            </Button>
                          </form>

                          {conversation.status !== ConversationStatus.RESOLVED && (
                            <form action={closeConversationAction}>
                              <input type="hidden" name="conversationId" value={conversation.id} />
                              <Button type="submit" size="sm" variant="secondary">
                                Close Conversation
                              </Button>
                            </form>
                          )}

                          <form action={deleteConversationAction}>
                            <input type="hidden" name="conversationId" value={conversation.id} />
                            <Button type="submit" size="sm" variant="destructive">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </div>

                      {insight ? (
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs">
                            Generated {insight.generatedAt ? formatDate(new Date(insight.generatedAt)) : "just now"}
                          </p>
                          <p>{insight.summary}</p>
                          <div>
                            <p className="mb-1 text-xs font-medium">Suggested answers</p>
                            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                              {insight.suggestedReplies.map((reply) => (
                                <li key={reply}>{reply}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          No AI summary yet. Generate one to get a concise chat overview and suggested replies.
                        </p>
                      )}
                    </div>
                  );
                })()}

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
                  <div className="space-y-2">
                    {conversation.messages.length > 40 && (
                      <p className="text-muted-foreground text-xs">
                        Showing latest 40 of {conversation.messages.length} messages.
                      </p>
                    )}
                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                      {conversation.messages.slice(-40).map((message) => (
                        <div key={message.id} className="bg-muted/40 rounded-md px-3 py-2 text-sm">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="secondary">{message.role}</Badge>
                            <Badge variant="outline">{message.agentType}</Badge>
                            <span className="text-muted-foreground text-xs">{formatDate(message.createdAt)}</span>
                          </div>
                          <p>{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
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