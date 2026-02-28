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
import { removeCartItem } from "@/lib/api/cart";
import { useCart } from "@/context/CartContext";

// ────────────────────────────────────────────────────────────────────────────
// NOTE: This file was rewritten to:
//  1. Fix the stale-closure bug in Vapi event listeners (ref-based handler)
//  2. Track a full ChatMessage[] history instead of a single transcript string
//  3. Expose liveTranscript (partial speech) for the UI
//  4. Support the proposeCartUpdate   client tool (pendingProposal state)
//  5. Async / fire-and-forget message persistence (debounced 2 s)
// ────────────────────────────────────────────────────────────────────────────

// ── Internal types ─────────────────────────────────────────────────────────────

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

// ── Exported types (used by AgentWidget) ──────────────────────────────────────

export type AgentStatus = "idle" | "connecting" | "active" | "escalated";

export type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
};

export type CartProposalItem = {
    variantId?: string;
    name: string;
    price: number;
    imageUrl?: string;
    action?: "add" | "remove" | "replace";
};

export type CartProposal = {
    toolCallId: string;
    message: string;
    items: CartProposalItem[];
};

interface AgentContextValue {
    status: AgentStatus;
    isSpeaking: boolean;
    isMuted: boolean;
    /** Full transcript history for the current call */
    messages: ChatMessage[];
    /** Partial (live) speech currently being spoken */
    liveTranscript: { role: "user" | "assistant"; content: string } | null;
    /** Cart update proposal waiting for customer Yes / No */
    pendingProposal: CartProposal | null;
    conversationId: string | null;
    isSidebarOpen: boolean;
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleMute: () => void;
    sendTextMessage: (text: string) => Promise<void>;
    approveProposal: () => void;
    rejectProposal: () => void;
    selectedMicrophoneId: string;
    setMicrophoneDevice: (deviceId: string) => Promise<void>;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AgentProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { removeItem, reloadCart, openCart } = useCart();

    const vapiRef = useRef<Vapi | null>(null);
    const isStartingRef = useRef(false);

    const [status, setStatus] = useState<AgentStatus>("idle");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [liveTranscript, setLiveTranscript] = useState<{ role: "user" | "assistant"; content: string } | null>(null);
    const [pendingProposal, setPendingProposal] = useState<CartProposal | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");

    const pendingUserMessageRef = useRef<string | null>(null);
    const pendingMicrophoneDeviceIdRef = useRef("");

    // Always-current session ID used for fire-and-forget message saves
    const sessionIdRef = useRef<string | null>(null);
    // Batch of messages queued for async persistence
    const pendingSaveRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("bakery_selected_mic_id") ?? "";
            if (saved) {
                setSelectedMicrophoneId(saved);
                pendingMicrophoneDeviceIdRef.current = saved;
            }
        } catch {
            // ignore storage access issues
        }
    }, []);

    // ── Async message save (fire-and-forget, debounced 2 s) ───────────────────
    const flushMessageSave = useCallback(() => {
        const batch = [...pendingSaveRef.current];
        pendingSaveRef.current = [];
        const sid = sessionIdRef.current;
        if (!sid || batch.length === 0) return;
        void fetch("/api/vapi/conversation/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, messages: batch }),
        }).catch(() => { /* non-critical */ });
    }, []);

    const scheduleMessageSave = useCallback(
        (msg: { role: "user" | "assistant"; content: string }) => {
            pendingSaveRef.current.push(msg);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(flushMessageSave, 2000);
        },
        [flushMessageSave],
    );

    // ── THE MESSAGE HANDLER — stored in a ref so it's always fresh ────────────
    // Calling `onMessageRef.current(msg)` in the Vapi listener avoids the
    // stale-closure problem (Vapi attaches the listener once at init time).
    const onMessageRef = useRef<(msg: VapiMessage) => void>(() => { });

    const handleMessage = useCallback(
        (msg: VapiMessage) => {
            // ── Live transcripts ──────────────────────────────────────────────
            if (msg.type === "transcript") {
                const role = (msg.role ?? "assistant") as "user" | "assistant";
                const content = msg.transcript ?? "";
                if (msg.transcriptType === "partial") {
                    setLiveTranscript({ role, content });
                } else if (msg.transcriptType === "final" && content.trim()) {
                    setLiveTranscript(null);
                    const newMsg: ChatMessage = {
                        id: crypto.randomUUID(),
                        role,
                        content,
                        timestamp: Date.now(),
                    };
                    setMessages((prev) => [...prev, newMsg]);
                    scheduleMessageSave({ role, content });
                }
                return;
            }

            // ── Client-side tool calls ────────────────────────────────────────
            const vapi = vapiRef.current;
            if (!vapi) return;

            const callList: ToolCall[] =
                msg.type === "tool-calls" && Array.isArray(msg.toolCallList)
                    ? msg.toolCallList.filter((c) => CLIENT_TOOL_NAMES.has(c.function.name))
                    : [];

            if (msg.type === "function-call" && msg.functionCall) {
                const { name, parameters, id } = msg.functionCall;
                if (CLIENT_TOOL_NAMES.has(name)) {
                    callList.push({
                        id: id ?? crypto.randomUUID(),
                        type: "function",
                        function: { name, arguments: JSON.stringify(parameters) },
                    });
                }
            }

            for (const call of callList) {
                void handleClientTool(vapi, call);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [scheduleMessageSave],
    );

    // Keep the ref current — no stale closures in Vapi listeners
    useEffect(() => {
        onMessageRef.current = handleMessage;
    }, [handleMessage]);

    // ── Execute one client tool and return result to Vapi ─────────────────────
    const handleClientTool = useCallback(
        async (vapi: Vapi, call: ToolCall) => {
            const { name } = call.function;
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(call.function.arguments); } catch { /* ignore */ }

            let result = "done";

            try {
                switch (name) {
                    case "navigateTo": {
                        const path = String(args.path ?? "/");
                        router.push(path);
                        result = `Navigated to ${path}`;
                        break;
                    }
                    case "openCartDrawer": {
                        openCart();
                        result = "Cart drawer opened";
                        break;
                    }
                    case "removeFromCart": {
                        const cartItemId = String(args.cartItemId ?? "");
                        const sid = (() => {
                            try { return localStorage.getItem("bakery_guest_session_id") ?? undefined; } catch { return undefined; }
                        })();
                        await removeCartItem(cartItemId, sid);
                        await reloadCart();
                        removeItem(cartItemId);
                        result = "Removed item from cart";
                        break;
                    }
                    case "proposeCartUpdate": {
                        const items = (args.items as CartProposalItem[] | undefined) ?? [];
                        const message = String(args.message ?? "Do you want me to update your cart?");
                        setPendingProposal({ toolCallId: call.id, message, items });
                        setIsSidebarOpen(true);
                        result = "Confirmation cards displayed. Ask the customer to confirm or decline.";
                        break;
                    }
                    default:
                        result = `Unknown client tool: ${name}`;
                }
            } catch (err) {
                result = `Error: ${err instanceof Error ? err.message : "Tool failed"}`;
            }

            vapi.send({
                type: "add-message",
                message: { role: "tool" as const, tool_call_id: call.id, content: result },
                triggerResponseEnabled: true,
            });
        },
        [router, openCart, removeItem, reloadCart],
    );

    // ── Proposal accept / reject ──────────────────────────────────────────────
    const approveProposal = useCallback(() => {
        setPendingProposal(null);
        vapiRef.current?.send({
            type: "add-message",
            message: { role: "user" as const, content: "Yes, please make those changes to my cart." },
            triggerResponseEnabled: true,
        });
    }, []);

    const rejectProposal = useCallback(() => {
        setPendingProposal(null);
        vapiRef.current?.send({
            type: "add-message",
            message: { role: "user" as const, content: "No, keep my cart as it is." },
            triggerResponseEnabled: true,
        });
    }, []);

    const isMeetingEndedEjection = useCallback((value: unknown) => {
        if (!value || typeof value !== "object") return false;

        const record = value as Record<string, unknown>;
        const candidates = [
            record.message,
            record.errorMsg,
            record.reason,
            record.type,
        ];

        return candidates.some((candidate) => {
            if (typeof candidate !== "string") return false;
            const text = candidate.toLowerCase();
            return text.includes("meeting has ended") || text.includes("due to ejection");
        });
    }, []);

    // ── Lazy Vapi initialisation (browser only) ────────────────────────────────
    const getVapi = useCallback(async (): Promise<Vapi> => {
        if (vapiRef.current) return vapiRef.current;

        const { default: VapiSDK } = await import("@vapi-ai/web");
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "";
        const instance = new VapiSDK(publicKey);

        instance.on("call-start", () => {
            setStatus("active");
            setMessages([]);
            setLiveTranscript(null);
            setPendingProposal(null);
            setIsSidebarOpen(true);

            if (pendingMicrophoneDeviceIdRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                void instance.setInputDevicesAsync({ audioSource: pendingMicrophoneDeviceIdRef.current as any });
            }

            if (pendingUserMessageRef.current) {
                instance.send({
                    type: "add-message",
                    message: { role: "user" as const, content: pendingUserMessageRef.current },
                    triggerResponseEnabled: true,
                });
                pendingUserMessageRef.current = null;
            }
        });

        instance.on("call-end", () => {
            setStatus("idle");
            setIsSpeaking(false);
            setIsMuted(false);
            setIsSidebarOpen(false);
            setLiveTranscript(null);
            setPendingProposal(null);
            isStartingRef.current = false;
            // Flush any unsaved messages immediately on call end
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            flushMessageSave();
        });

        instance.on("speech-start", () => setIsSpeaking(true));
        instance.on("speech-end", () => setIsSpeaking(false));

        // Delegate to the ref — always calls the current (fresh) handler
        // This is the fix for the stale-closure bug.
        instance.on("message", (msg: VapiMessage) => onMessageRef.current(msg));

        instance.on("error", (err) => {
            if (isMeetingEndedEjection(err)) {
                setStatus("idle");
                setIsSpeaking(false);
                setIsMuted(false);
                setIsSidebarOpen(false);
                isStartingRef.current = false;
                return;
            }
            console.error("[Vapi error]", err);
            setStatus("idle");
            isStartingRef.current = false;
        });

        vapiRef.current = instance;
        return instance;
    }, [isMeetingEndedEjection, flushMessageSave]);

    // ── Start call ────────────────────────────────────────────────────────────────
    const startCall = useCallback(async () => {
        if (status !== "idle" || isStartingRef.current) return;
        isStartingRef.current = true;
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
            sessionIdRef.current = sessionId;

            // Fire-and-forget — does not block the call
            void fetch("/api/vapi/conversation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            }).catch(() => { /* non-critical */ });
        } catch (err) {
            if (!isMeetingEndedEjection(err)) {
                console.error("[startCall] error:", err);
            }
            setStatus("idle");
        } finally {
            isStartingRef.current = false;
        }
    }, [status, getVapi, isMeetingEndedEjection]);

    const sendTextMessage = useCallback(
        async (text: string) => {
            const message = text.trim();
            if (!message) return;

            if (status === "idle") {
                pendingUserMessageRef.current = message;
                await startCall();
                return;
            }

            if (status === "connecting") {
                pendingUserMessageRef.current = message;
                return;
            }

            if (status !== "active" || !vapiRef.current) return;

            vapiRef.current.send({
                type: "add-message",
                message: {
                    role: "user" as const,
                    content: message,
                },
                triggerResponseEnabled: true,
            });
        },
        [status, startCall],
    );

    const setMicrophoneDevice = useCallback(async (deviceId: string) => {
        const nextDeviceId = deviceId.trim();

        setSelectedMicrophoneId(nextDeviceId);
        pendingMicrophoneDeviceIdRef.current = nextDeviceId;

        try {
            localStorage.setItem("bakery_selected_mic_id", nextDeviceId);
        } catch {
            // ignore storage access issues
        }

        if (!vapiRef.current || status !== "active" || !nextDeviceId) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await vapiRef.current.setInputDevicesAsync({ audioSource: nextDeviceId as any });
        } catch (err) {
            console.error("[setMicrophoneDevice] error:", err);
        }
    }, [status]);

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
                messages,
                liveTranscript,
                pendingProposal,
                conversationId,
                isSidebarOpen,
                startCall,
                endCall,
                toggleMute,
                sendTextMessage,
                approveProposal,
                rejectProposal,
                selectedMicrophoneId,
                setMicrophoneDevice,
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
