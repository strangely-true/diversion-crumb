"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Bot, X, Sparkles } from "lucide-react";
import { useAgent } from "@/context/AgentContext";

const suggestions = [
    "Can you suggest a bestseller from today?",
    "What are your egg-free options?",
    "Help me build a birthday dessert order.",
];

/**
 * Voice-agent sidebar.
 * Fixed to the right edge of the viewport; visible on all pages except auth.
 *
 * UX states:
 *  idle        → "Talk to Crumb" start button
 *  connecting  → spinner + "Connecting…"
 *  active      → live transcript, mute + end controls
 *  escalated   → "Human agent joining…"
 */
export default function AgentWidget() {
    const {
        status,
        isSpeaking,
        isMuted,
        transcript,
        isSidebarOpen,
        startCall,
        endCall,
        toggleMute,
        sendTextMessage,
        selectedMicrophoneId,
        setMicrophoneDevice,
        openSidebar,
        closeSidebar,
        toggleSidebar,
    } = useAgent();
    const [input, setInput] = useState("");
    const [microphones, setMicrophones] = useState<Array<{ deviceId: string; label: string }>>([]);

    const isConnecting = status === "connecting";
    const isActive = status === "active";
    const isEscalated = status === "escalated";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isEscalated) return;
        const message = input;
        setInput("");
        await sendTextMessage(message);
    };

    const handleSuggestionClick = async (suggestion: string) => {
        if (isEscalated) return;
        await sendTextMessage(suggestion);
    };

    useEffect(() => {
        let disposed = false;

        const loadMicrophones = async () => {
            if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;

            let devices = await navigator.mediaDevices.enumerateDevices();
            let audioInputs = devices.filter((device) => device.kind === "audioinput");

            if (audioInputs.length > 0 && audioInputs.every((device) => !device.label)) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach((track) => track.stop());
                    devices = await navigator.mediaDevices.enumerateDevices();
                    audioInputs = devices.filter((device) => device.kind === "audioinput");
                } catch {
                    // Permission may be blocked; keep fallback labels
                }
            }

            if (disposed) return;

            const next = audioInputs.map((device, index) => ({
                deviceId: device.deviceId,
                label: device.label || `Microphone ${index + 1}`,
            }));
            setMicrophones(next);

            if (!selectedMicrophoneId && next[0]) {
                void setMicrophoneDevice(next[0].deviceId);
            }
        };

        const handleDeviceChange = () => {
            void loadMicrophones();
        };

        void loadMicrophones();
        navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);

        return () => {
            disposed = true;
            navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
        };
    }, [selectedMicrophoneId, setMicrophoneDevice]);

    // Auto-open sidebar when a call becomes active
    useEffect(() => {
        if (isActive) openSidebar();
    }, [isActive, openSidebar]);

    return (
        <>
            {/* ── Sidebar toggle tab ─────────────────────────────────────────────── */}
            <button
                type="button"
                onClick={toggleSidebar}
                title={isSidebarOpen ? "Close assistant" : "Chat with Crumb"}
                aria-label={isSidebarOpen ? "Close assistant" : "Chat with Crumb"}
                className={`
                    fixed top-1/2 z-[81] -translate-y-1/2
                    flex flex-col items-center gap-1.5
                    rounded-l-2xl px-2.5 py-5 shadow-lg
                    transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${isSidebarOpen ? "right-[22rem]" : "right-0"}
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
                    Crumb
                </span>
                {/* Active pulse dot */}
                {isActive && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white animate-pulse" />
                )}
            </button>

            {/* ── Sidebar panel ──────────────────────────────────────────────────── */}
            <aside
                className={`
                    fixed right-0 top-0 z-[80] flex h-full w-[22rem] flex-col
                    bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--surface-2)_100%)] shadow-2xl
                    border-l border-[color:var(--border)]
                    transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${isSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
                `}
            >
                {/* ── Header ──────────────────────────────────────────────────────── */}
                <div className="relative flex items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--surface-1)] px-4 py-3 shrink-0">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--surface-3),transparent_65%)] opacity-90" />
                    <div className="flex items-center gap-2">
                        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-[var(--shadow-soft)]">
                            <Bot size={16} />
                            {isActive && (
                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[color:var(--surface-1)] animate-pulse" />
                            )}
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-semibold text-[color:var(--text-strong)] leading-none">Crumb</p>
                            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">AI Bakery Assistant</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={closeSidebar}
                        className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-2)]"
                        title="Close"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* ── Status bar ──────────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-xs shrink-0">
                    <span
                        className={`h-2 w-2 rounded-full shrink-0 ${isActive
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
                                    ? "Crumb is speaking…"
                                    : "Listening…"
                                : isEscalated
                                    ? "Escalating to human agent…"
                                    : "Ready to help"}
                    </span>
                </div>

                <div className="border-b border-[color:var(--border)] px-4 py-3 shrink-0">
                    <label
                        htmlFor="crumb-mic-selector"
                        className="mb-1.5 block text-xs font-medium text-[color:var(--text-muted)]"
                    >
                        Microphone
                    </label>
                    <select
                        id="crumb-mic-selector"
                        value={selectedMicrophoneId}
                        onChange={(e) => void setMicrophoneDevice(e.currentTarget.value)}
                        disabled={isEscalated || microphones.length === 0}
                        className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {microphones.length === 0 ? (
                            <option value="">No microphones found</option>
                        ) : (
                            microphones.map((device) => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* ── Conversation area ────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {isActive && transcript ? (
                        <div className="rounded-2xl bg-[color:var(--surface-1)] px-4 py-3 text-sm ring-1 ring-[color:var(--border)] shadow-[var(--shadow-soft)] transition-all duration-300">
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[color:var(--text-muted)]">
                                <span
                                    className={`inline-block h-2 w-2 rounded-full ${isSpeaking ? "animate-pulse bg-green-500" : "bg-amber-400"
                                        }`}
                                />
                                {isSpeaking ? "Crumb" : "You said"}
                            </div>
                            <p className="leading-relaxed text-[color:var(--text-primary)]">{transcript}</p>
                        </div>
                    ) : (
                        <div className="mt-6 flex flex-col items-center gap-3 text-center px-2">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--surface-3)] text-[color:var(--accent)] ring-1 ring-[color:var(--border)]">
                                <Sparkles size={26} />
                            </div>
                            <div>
                                <p className="font-semibold text-[color:var(--text-strong)]">Hi, I&apos;m Crumb!</p>
                                <p className="mt-1 text-sm text-[color:var(--text-muted)] leading-relaxed">
                                    I can help you browse our menu, check ingredients, add items to your cart, and more.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Controls ─────────────────────────────────────────────────────── */}
                <div className="px-4 py-4 border-t border-[color:var(--border)] shrink-0">
                    <div className="mb-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => void handleSuggestionClick(suggestion)}
                                    disabled={isEscalated}
                                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-xs text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={(e) => void handleSubmit(e)} className="flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.currentTarget.value)}
                                placeholder="Say something..."
                                rows={2}
                                className="min-h-[42px] flex-1 resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2 text-sm text-[color:var(--text-primary)] outline-none ring-0 placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--accent)]"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isEscalated}
                                className="h-10 shrink-0 rounded-full bg-[color:var(--accent)] px-4 text-xs font-semibold text-[color:var(--accent-contrast)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Send
                            </button>
                        </form>
                    </div>

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
                                        : "Talk to Crumb"}
                            </span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
