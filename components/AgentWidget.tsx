"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Bot, X } from "lucide-react";
import { useAgent } from "@/context/AgentContext";

/**
 * Voice-agent sidebar.
 * Fixed to the right edge of the viewport; visible on all pages except auth.
 *
 * UX states:
 *  idle        → "Talk to Rosie" start button
 *  connecting  → spinner + "Connecting…"
 *  active      → live transcript, mute + end controls
 *  escalated   → "Human agent joining…"
 */
export default function AgentWidget() {
    const { status, isSpeaking, isMuted, transcript, startCall, endCall, toggleMute } =
        useAgent();

    const [isOpen, setIsOpen] = useState(false);

    const isConnecting = status === "connecting";
    const isActive = status === "active";
    const isEscalated = status === "escalated";

    // Auto-open sidebar when a call becomes active
    useEffect(() => {
        if (isActive) setIsOpen(true);
    }, [isActive]);

    return (
        <>
            {/* ── Sidebar toggle tab ─────────────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                title={isOpen ? "Close assistant" : "Chat with Rosie"}
                aria-label={isOpen ? "Close assistant" : "Chat with Rosie"}
                className={`
                    fixed right-0 top-1/2 z-[81] -translate-y-1/2
                    flex flex-col items-center gap-1.5
                    rounded-l-2xl px-2.5 py-5 shadow-lg
                    transition-all duration-200
                    ${isActive
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : isConnecting
                            ? "bg-amber-400 text-white cursor-wait"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                    }
                `}
            >
                {isConnecting ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Bot size={18} />
                )}
                {/* Vertical label */}
                <span
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                >
                    Rosie
                </span>
                {/* Active pulse dot */}
                {isActive && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white animate-pulse" />
                )}
            </button>

            {/* ── Sidebar panel ──────────────────────────────────────────────────── */}
            <aside
                className={`
                    fixed right-0 top-0 z-[80] flex h-full w-80 flex-col
                    bg-[color:var(--surface-1)] shadow-2xl
                    border-l border-[color:var(--border)]
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                `}
            >
                {/* ── Header ──────────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)] bg-amber-50 dark:bg-amber-950/50 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
                            <Bot size={16} />
                            {isActive && (
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-amber-50 dark:ring-amber-950/50 animate-pulse" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[color:var(--text-strong)] leading-none">Rosie</p>
                            <p className="text-xs text-[color:var(--text-muted)] mt-0.5">AI Bakery Assistant</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)] transition-colors"
                        title="Close"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* ── Status bar ──────────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 px-4 py-2 text-xs border-b border-[color:var(--border)] shrink-0 bg-[color:var(--surface-2)]">
                    <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                            isActive
                                ? "bg-green-500 animate-pulse"
                                : isConnecting
                                    ? "bg-amber-400 animate-pulse"
                                    : isEscalated
                                        ? "bg-blue-400 animate-pulse"
                                        : "bg-[color:var(--text-muted)]"
                        }`}
                    />
                    <span className="text-[color:var(--text-muted)]">
                        {isConnecting
                            ? "Connecting…"
                            : isActive
                                ? isSpeaking
                                    ? "Rosie is speaking…"
                                    : "Listening…"
                                : isEscalated
                                    ? "Escalating to human agent…"
                                    : "Ready to help"}
                    </span>
                </div>

                {/* ── Conversation area ────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {isActive && transcript ? (
                        <div className="rounded-2xl bg-[color:var(--surface-2)] px-4 py-3 text-sm ring-1 ring-[color:var(--border)]">
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[color:var(--text-muted)]">
                                <span
                                    className={`inline-block h-2 w-2 rounded-full ${
                                        isSpeaking ? "animate-pulse bg-green-500" : "bg-amber-400"
                                    }`}
                                />
                                {isSpeaking ? "Rosie" : "You said"}
                            </div>
                            <p className="leading-relaxed text-[color:var(--text-primary)]">{transcript}</p>
                        </div>
                    ) : (
                        <div className="mt-6 flex flex-col items-center gap-3 text-center px-2">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500">
                                <Bot size={28} />
                            </div>
                            <div>
                                <p className="font-semibold text-[color:var(--text-strong)]">Hi, I'm Rosie!</p>
                                <p className="mt-1 text-sm text-[color:var(--text-muted)] leading-relaxed">
                                    I can help you browse our menu, check ingredients, add items to your cart, and more.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Controls ─────────────────────────────────────────────────────── */}
                <div className="px-4 py-4 border-t border-[color:var(--border)] shrink-0">
                    {isActive ? (
                        <div className="flex items-center gap-2">
                            {/* Mute toggle */}
                            <button
                                type="button"
                                onClick={toggleMute}
                                title={isMuted ? "Unmute" : "Mute"}
                                className={`
                                    flex flex-1 items-center justify-center gap-2
                                    h-11 rounded-full border font-medium text-sm
                                    shadow-sm transition-all hover:scale-[1.02]
                                    ${isMuted
                                        ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-950/50"
                                        : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-strong)]"
                                    }
                                `}
                            >
                                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                                <span>{isMuted ? "Unmute" : "Mute"}</span>
                            </button>

                            {/* End call */}
                            <button
                                type="button"
                                onClick={endCall}
                                title="End call"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600 hover:scale-[1.02]"
                            >
                                <PhoneOff size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={isConnecting || isEscalated ? undefined : startCall}
                            disabled={isConnecting || isEscalated}
                            className={`
                                w-full flex items-center justify-center gap-2.5
                                h-12 rounded-full font-semibold text-sm shadow-sm
                                transition-all
                                ${isConnecting || isEscalated
                                    ? "bg-amber-300 text-white cursor-not-allowed opacity-80"
                                    : "bg-amber-500 hover:bg-amber-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                                }
                            `}
                        >
                            {isConnecting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Mic size={18} />
                            )}
                            <span>
                                {isConnecting
                                    ? "Connecting…"
                                    : isEscalated
                                        ? "Human agent joining…"
                                        : "Talk to Rosie"}
                            </span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
