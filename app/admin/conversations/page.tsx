import { AdminService } from "@/server/services/admin.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminConversationsPage() {
  const conversations = await AdminService.getConversations();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Conversations</h1>
        <p className="text-muted-foreground text-sm">All user conversations with the agent.</p>
      </div>

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
                <span className="font-medium">{conversation.user?.email ?? "Guest user"}</span>
                <span className="text-muted-foreground">{conversation.messages.length} messages</span>
                <span className="text-muted-foreground">Updated {formatDate(conversation.updatedAt)}</span>
              </summary>
              <div className="mt-3 space-y-2">
                {conversation.messages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No messages.</p>
                ) : (
                  conversation.messages.map((message) => (
                    <div key={message.id} className="bg-muted/40 rounded-md px-3 py-2 text-sm">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="secondary">{message.role}</Badge>
                        <span className="text-muted-foreground text-xs">{formatDate(message.createdAt)}</span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  ))
                )}
              </div>
            </details>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}