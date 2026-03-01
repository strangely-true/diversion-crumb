"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Bot, Send, User, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ToolResultRenderer } from "@/components/admin/chat/AdminChatComponents";

// ─── Types ────────────────────────────────────────────────────────────────────

type TextPart = { type: "text"; content: string };
type ToolResultPart = { type: "tool-result"; toolName: string; result: unknown };
type MessagePart = TextPart | ToolResultPart;

type Message = {
    id: string;
    role: "user" | "assistant";
    parts: MessagePart[];
};

// Helper: flat text content for the conversation history sent to the API
function partsToText(parts: MessagePart[]): string {
    return parts
        .filter((p): p is TextPart => p.type === "text")
        .map((p) => p.content)
        .join("");
}

// ─── AI SDK data-stream parser hook ──────────────────────────────────────────

function useAdminChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    // Keep a ref for the latest messages array so we can read it inside callbacks
    const messagesRef = useRef<Message[]>([]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    const append = useCallback(async (userContent: string) => {
        if (!userContent.trim()) return;
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text", content: userContent.trim() }],
        };
        const assistantId = crypto.randomUUID();
        const assistantPlaceholder: Message = {
            id: assistantId,
            role: "assistant",
            parts: [],
        };

        setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
        setIsLoading(true);
        setError(null);

        // Tool call map: toolCallId → toolName (built as stream arrives)
        // Not needed for the custom NDJSON format but kept in case of format updates

        function processLine(line: string) {
            if (!line.trim()) return;
            let part: { t: string; v?: string; name?: string; r?: unknown };
            try { part = JSON.parse(line); } catch { return; }

            if (part.t === "text" && typeof part.v === "string") {
                // Text delta — append to last text part or create a new one
                const delta = part.v;
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id !== assistantId) return m;
                        const parts = [...m.parts];
                        const last = parts.at(-1);
                        if (last?.type === "text") {
                            return { ...m, parts: [...parts.slice(0, -1), { type: "text" as const, content: last.content + delta }] };
                        }
                        return { ...m, parts: [...parts, { type: "text" as const, content: delta }] };
                    }),
                );
            } else if (part.t === "tool" && typeof part.name === "string") {
                // Tool result — add a tool-result part
                const toolName = part.name;
                const result = part.r;
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id !== assistantId) return m;
                        return { ...m, parts: [...m.parts, { type: "tool-result" as const, toolName, result }] };
                    }),
                );
            }
        }

        try {
            // Build API history from current messages
            const history = messagesRef.current.map((m) => ({
                role: m.role,
                content: partsToText(m.parts),
            }));
            const response = await fetch("/api/admin/ai/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...history, { role: "user", content: userContent.trim() }],
                }),
                signal: abortRef.current.signal,
            });

            if (!response.ok) {
                const err = (await response.json().catch(() => ({ error: "Request failed" }))) as { error?: string };
                throw new Error(err.error ?? `HTTP ${response.status}`);
            }
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partial = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                partial += decoder.decode(value, { stream: true });
                const lines = partial.split("\n");
                partial = lines.pop() ?? "";
                for (const line of lines) processLine(line);
            }
            if (partial.trim()) processLine(partial);

        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            const msg = err instanceof Error ? err.message : "Something went wrong";
            setError(msg);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, parts: [{ type: "text", content: `⚠️ Error: ${msg}` }] }
                        : m,
                ),
            );
        } finally {
            setIsLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const clear = useCallback(() => {
        abortRef.current?.abort();
        setMessages([]);
        setIsLoading(false);
        setError(null);
    }, []);

    return { messages, isLoading, error, append, clear };
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function AssistantMarkdown({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                hr: () => <hr className="my-3 border-border" />,
                a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-70">
                        {children}
                    </a>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-border pl-3 my-2 text-muted-foreground italic">
                        {children}
                    </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                    const isInline = !className && typeof children === "string" && !String(children).includes("\n");
                    if (isInline) {
                        return (
                            <code className="bg-background/60 border border-border rounded px-1 py-0.5 font-mono text-[0.8em]">
                                {children}
                            </code>
                        );
                    }
                    return <code className={cn("font-mono text-[0.8em]", className)}>{children}</code>;
                },
                pre: ({ children }) => (
                    <pre className="bg-background/60 border border-border rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono leading-relaxed">
                        {children}
                    </pre>
                ),
                table: ({ children }) => (
                    <div className="my-2 overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }) => <thead className="bg-background/50">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                tr: ({ children }) => <tr className="divide-x divide-border">{children}</tr>,
                th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-foreground">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-muted-foreground">{children}</td>,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
            <div
                className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border",
                    isUser
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground",
                )}
            >
                {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
            </div>

            <div className={cn("flex flex-col gap-2", isUser ? "items-end max-w-[85%]" : "items-start w-full max-w-[95%]")}>
                {message.parts.length === 0 ? (
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                        <span className="text-muted-foreground italic text-xs">…</span>
                    </div>
                ) : (
                    message.parts.map((part, i) => {
                        if (part.type === "text") {
                            if (!part.content.trim()) return null;
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "rounded-2xl px-4 py-2.5 text-sm",
                                        isUser
                                            ? "bg-primary text-primary-foreground rounded-tr-sm leading-relaxed"
                                            : "bg-muted text-foreground rounded-tl-sm",
                                    )}
                                >
                                    {isUser ? part.content : <AssistantMarkdown content={part.content} />}
                                </div>
                            );
                        }
                        // tool-result part → rich component
                        return (
                            <div key={i} className="w-full">
                                <ToolResultRenderer toolName={part.toolName} result={part.result} />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAIAgent() {
    const { messages, isLoading, append, clear } = useAdminChat();
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;
        const value = input;
        setInput("");
        await append(value);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
        }
    }

    const SUGGESTIONS = [
        "Show me dashboard stats",
        "List all users",
        "List all orders",
        "Show low-stock inventory",
        "List all products",
        "Show all conversations",
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Bot className="size-5 text-primary" />
                        Admin AI Agent
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Powered by Gemini 2.5 Flash · Full admin access · Streams charts & tables
                    </p>
                </div>
                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clear}
                        className="text-muted-foreground hover:text-destructive gap-1.5"
                    >
                        <Trash2 className="size-3.5" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                        <div className="rounded-full border bg-muted p-4">
                            <Bot className="size-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">Admin Agent ready</p>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                Ask anything about users, products, orders, inventory, or
                                conversations. Charts and tables stream in real-time.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        setInput(s);
                                        textareaRef.current?.focus();
                                    }}
                                    className="rounded-full border bg-background px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                ))}

                {isLoading && messages.at(-1)?.parts.length === 0 && (
                    <div className="flex gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                            <Bot className="size-3.5" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t pt-4">
                <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Ask the admin agent anything… (Enter to send, Shift+Enter for newline)"
                        className="min-h-[44px] max-h-32 resize-none text-sm"
                        rows={1}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="shrink-0 size-[44px]"
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    This agent has live write access. Confirm destructive operations carefully.
                </p>
            </div>
        </div>
    );
}


