"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import type Vapi from "@vapi-ai/web";
import { buildVapiAssistantConfig, CLIENT_TOOL_NAMES } from "@/lib/vapi";
import { addCartItem, removeCartItem } from "@/lib/api/cart";
import { useCart } from "@/context/CartContext";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ToolCall {
    id: string;
    type: string;
    function: { name: string; arguments: string };
}

interface VapiMessage {
    type: string;
    role?: string;
    transcript?: string;
    transcriptType?: string;
    toolCallList?: ToolCall[];
    // legacy Vapi message shape
    functionCall?: { name: string; parameters: Record<string, unknown>; id?: string };
}

export type AgentStatus = "idle" | "connecting" | "active" | "escalated";

interface AgentContextValue {
    status: AgentStatus;
    isSpeaking: boolean;
    isMuted: boolean;
    transcript: string;
    conversationId: string | null;
    isSidebarOpen: boolean;
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleMute: () => void;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AgentProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { addToCart, removeItem, reloadCart, openCart } = useCart();

    const vapiRef = useRef<Vapi | null>(null);
    const [status, setStatus] = useState<AgentStatus>("idle");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ── Lazy Vapi initialisation (browser only) ────────────────────────────────
    const getVapi = useCallback(async (): Promise<Vapi> => {
        if (vapiRef.current) return vapiRef.current;

        const { default: VapiSDK } = await import("@vapi-ai/web");
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";
        const instance = new VapiSDK(publicKey);

        // ── Event handlers ───────────────────────────────────────────────────────
        instance.on("call-start", () => {
            setStatus("active");
            setTranscript("");
        });

        instance.on("call-end", () => {
            setStatus("idle");
            setIsSpeaking(false);
            setIsMuted(false);
            setIsSidebarOpen(false);
        });

        instance.on("speech-start", () => setIsSpeaking(true));
        instance.on("speech-end", () => setIsSpeaking(false));

        instance.on("message", (msg: VapiMessage) => {
            // Live transcript
            if (msg.type === "transcript" && msg.transcriptType === "final") {
                setTranscript(msg.transcript ?? "");
            }

            // Client-side tool calls ─ handle tools that have no serverUrl
            if (msg.type === "tool-calls" && Array.isArray(msg.toolCallList)) {
                void handleToolCalls(instance, msg.toolCallList);
            }

            // Legacy function-call shape (older Vapi SDK versions)
            if (msg.type === "function-call" && msg.functionCall) {
                const { name, parameters, id } = msg.functionCall;
                if (CLIENT_TOOL_NAMES.has(name)) {
                    void handleSingleClientTool(instance, {
                        id: id ?? crypto.randomUUID(),
                        type: "function",
                        function: { name, arguments: JSON.stringify(parameters) },
                    });
                }
            }
        });

        instance.on("error", (err) => {
            console.error("[Vapi error]", err);
            setStatus("idle");
        });

        vapiRef.current = instance;
        return instance;
    }, []);

    // ── Handle multiple client-tool calls ────────────────────────────────────────
    const handleToolCalls = useCallback(
        async (vapi: Vapi, calls: ToolCall[]) => {
            const clientCalls = calls.filter((c) => CLIENT_TOOL_NAMES.has(c.function.name));

            for (const call of clientCalls) {
                await handleSingleClientTool(vapi, call);
            }
        },
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
        [],
    );

    // ── Execute one client tool and return result to Vapi ────────────────────────
    const handleSingleClientTool = useCallback(
        async (vapi: Vapi, call: ToolCall) => {
            const { name } = call.function;
            let args: Record<string, unknown> = {};
            try {
                args = JSON.parse(call.function.arguments);
            } catch {
                // ignore parse errors
            }

            let result = "done";

            try {
                switch (name) {
                    // ──────────────────────────────────────────────────────────────────
                    case "navigateTo": {
                        const path = String(args.path ?? "/");
                        router.push(path);
                        result = `Navigated to ${path}`;
                        break;
                    }

                    // ──────────────────────────────────────────────────────────────────
                    case "openCartDrawer": {
                        openCart();
                        result = "Cart drawer opened";
                        break;
                    }

                    // ──────────────────────────────────────────────────────────────────
                    case "addToCart": {
                        const variantId = String(args.variantId ?? "");
                        const qty = typeof args.quantity === "number" ? args.quantity : 1;
                        const productName = String(args.productName ?? "item");

                        // Call cart API directly to get the updated cart
                        const sessionId = (() => {
                            try {
                                return localStorage.getItem("bakery_guest_session_id") ?? undefined;
                            } catch {
                                return undefined;
                            }
                        })();

                        await addCartItem({ variantId, quantity: qty, currency: "USD", sessionId });
                        await reloadCart();

                        // Also use CartContext addToCart for optimistic update + toast
                        addToCart({ id: variantId, name: productName, price: 0 });

                        result = `Added ${qty}x ${productName} to your cart`;
                        break;
                    }

                    // ──────────────────────────────────────────────────────────────────
                    case "removeFromCart": {
                        const cartItemId = String(args.cartItemId ?? "");
                        const sessionId = (() => {
                            try {
                                return localStorage.getItem("bakery_guest_session_id") ?? undefined;
                            } catch {
                                return undefined;
                            }
                        })();

                        await removeCartItem(cartItemId, sessionId);
                        await reloadCart();
                        removeItem(cartItemId);

                        result = `Removed item from cart`;
                        break;
                    }

                    default:
                        result = `Unknown client tool: ${name}`;
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Tool failed";
                result = `Error: ${msg}`;
            }

            // Send tool result back to Vapi so the AI can respond
            vapi.send({
                type: "add-message",
                message: {
                    role: "tool" as const,
                    tool_call_id: call.id,
                    content: result,
                },
                triggerResponseEnabled: true,
            });
        },
        [router, openCart, addToCart, removeItem, reloadCart],
    );

    // ── Start call ────────────────────────────────────────────────────────────────
    const startCall = useCallback(async () => {
        if (status !== "idle") return;
        setStatus("connecting");

        try {
            const vapi = await getVapi();
            const config = buildVapiAssistantConfig();

            // Attach the assistantId if configured, otherwise use inline config
            const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
            if (assistantId && assistantId !== "your_vapi_assistant_id_here") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await vapi.start(assistantId, config.model as any);
            } else {
                // Inline config — handy for development without a pre-created assistant
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await vapi.start(config as any);
            }

            // Create/retrieve a conversation record for this session
            const sessionId = (() => {
                try {
                    let id = localStorage.getItem("bakery_agent_session");
                    if (!id) {
                        id = crypto.randomUUID();
                        localStorage.setItem("bakery_agent_session", id);
                    }
                    return id;
                } catch {
                    return crypto.randomUUID();
                }
            })();

            setConversationId(sessionId);

            try {
                await fetch("/api/vapi/conversation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId }),
                });
            } catch {
                // non-critical
            }
        } catch (err) {
            console.error("[startCall] error:", err);
            setStatus("idle");
        }
    }, [status, getVapi]);

    // ── End call ──────────────────────────────────────────────────────────────────
    const endCall = useCallback(() => {
        vapiRef.current?.stop();
        setStatus("idle");
    }, []);

    // ── Toggle mute ───────────────────────────────────────────────────────────────
    const toggleMute = useCallback(() => {
        if (!vapiRef.current) return;
        const next = !isMuted;
        vapiRef.current.setMuted(next);
        setIsMuted(next);
    }, [isMuted]);

    const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
    const toggleSidebar = useCallback(() => {
        setIsSidebarOpen((open) => !open);
    }, []);

    // ── Cleanup on unmount ────────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            vapiRef.current?.stop();
        };
    }, []);

    return (
        <AgentContext.Provider
            value={{
                status,
                isSpeaking,
                isMuted,
                transcript,
                conversationId,
                isSidebarOpen,
                startCall,
                endCall,
                toggleMute,
                openSidebar,
                closeSidebar,
                toggleSidebar,
            }}
        >
            {children}
        </AgentContext.Provider>
    );
}

export function useAgent() {
    const ctx = useContext(AgentContext);
    if (!ctx) throw new Error("useAgent must be used within AgentProvider");
    return ctx;
}
