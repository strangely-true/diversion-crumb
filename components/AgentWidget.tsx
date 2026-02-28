"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    Mic, MicOff, PhoneOff, Loader2, X,
    ShoppingCart, CheckCircle2, XCircle,
} from "lucide-react";
import { useAgent, type ChatMessage, type CartProposal } from "@/context/AgentContext";

// ── Static data ──────────────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
    "Suggest a bestseller today",
    "What are your egg-free options?",
    "Help me build a birthday order",
] as const;

// Waveform bar heights (px) — used in the animated footer wave
const WAVE_BARS = [6, 10, 16, 12, 20, 14, 8, 16, 10, 14] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm ${isUser
                    ? "rounded-br-sm bg-[#2E6B5A]"
                    : "rounded-bl-sm bg-[#243D34]"
                    }`}
            >
                {msg.content}
            </div>
        </div>
    );
}

function LiveBubble({
    live,
}: {
    live: { role: "user" | "assistant"; content: string };
}) {
    const isUser = live.role === "user";
    return (
        <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`flex max-w-[82%] items-end gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm text-white/60 shadow-sm ${isUser ? "rounded-br-sm bg-[#2E6B5A]/50" : "rounded-bl-sm bg-[#243D34]/50"
                    }`}
            >
                <span className="leading-relaxed">{live.content}</span>
                <span className="mb-0.5 inline-flex shrink-0 gap-0.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="h-1 w-1 rounded-full bg-white/50 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </span>
            </div>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-[#243D34] px-4 py-3 shadow-sm">
                <span className="inline-flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="h-2 w-2 rounded-full bg-white/50 animate-bounce"
                            style={{ animationDelay: `${i * 0.18}s` }}
                        />
                    ))}
                </span>
            </div>
        </div>
    );
}

function ProposalCards({
    proposal,
    onApprove,
    onReject,
}: {
    proposal: CartProposal;
    onApprove: () => void;
    onReject: () => void;
}) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-white/80 leading-relaxed">{proposal.message}</p>

            {proposal.items.map((item, idx) => (
                <div
                    key={item.variantId ?? idx}
                    className="flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow"
                >
                    {item.imageUrl ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="56px"
                            />
                        </div>
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#1B3329] text-white/40">
                            <ShoppingCart size={20} />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                        {item.action && (
                            <span className="mt-1 inline-block rounded-full bg-[#1B3329]/10 px-2 py-0.5 text-[10px] font-medium text-[#1B3329] capitalize">
                                {item.action}
                            </span>
                        )}
                    </div>
                </div>
            ))}

            {/* Yes / No buttons */}
            <div className="flex gap-2 pt-1">
                <button
                    type="button"
                    onClick={onApprove}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2E6B5A] py-2.5 text-sm font-semibold text-white transition hover:bg-[#3a7a68] active:scale-95"
                >
                    <CheckCircle2 size={15} />
                    Yes, add them
                </button>
                <button
                    type="button"
                    onClick={onReject}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/20 active:scale-95"
                >
                    <XCircle size={15} />
                    No thanks
                </button>
            </div>
        </div>
    );
}

function Waveform({ active }: { active: boolean }) {
    return (
        <div className="flex items-end gap-[3px] h-6">
            {WAVE_BARS.map((h, i) => (
                <span
                    key={i}
                    className="w-[3px] rounded-full bg-white/60 transition-all duration-300"
                    style={{
                        height: active ? `${h}px` : "3px",
                        transitionDelay: active ? `${i * 30}ms` : "0ms",
                    }}
                />
            ))}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentWidget() {
    const {
        status,
        isSpeaking,
        isMuted,
        messages,
        liveTranscript,
        pendingProposal,
        isSidebarOpen,
        startCall,
        endCall,
        toggleMute,
        sendTextMessage,
        approveProposal,
        rejectProposal,
        selectedMicrophoneId,
        setMicrophoneDevice,
        closeSidebar,
        toggleSidebar,
    } = useAgent();

    const [input, setInput] = useState("");
    const [microphones, setMicrophones] = useState<Array<{ deviceId: string; label: string }>>([]);
    const [showMicPicker, setShowMicPicker] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isIdle = status === "idle";
    const isConnecting = status === "connecting";
    const isActive = status === "active";
    const isEscalated = status === "escalated";

    // Auto-scroll chat to bottom whenever messages/liveTranscript change
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, liveTranscript, pendingProposal]);

    // Enumerate microphones
    useEffect(() => {
        let disposed = false;

        const loadMics = async () => {
            if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
            let devs = await navigator.mediaDevices.enumerateDevices();
            let inputs = devs.filter((d) => d.kind === "audioinput");
            if (inputs.length > 0 && inputs.every((d) => !d.label)) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach((t) => t.stop());
                    devs = await navigator.mediaDevices.enumerateDevices();
                    inputs = devs.filter((d) => d.kind === "audioinput");
                } catch { /* permission blocked */ }
            }
            if (disposed) return;
            const next = inputs.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
            setMicrophones(next);
            if (!selectedMicrophoneId && next[0]) void setMicrophoneDevice(next[0].deviceId);
        };

        void loadMics();
        navigator.mediaDevices?.addEventListener?.("devicechange", () => void loadMics());
        return () => {
            disposed = true;
            navigator.mediaDevices?.removeEventListener?.("devicechange", () => void loadMics());
        };
    }, [selectedMicrophoneId, setMicrophoneDevice]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const msg = input.trim();
        if (!msg || isEscalated) return;
        setInput("");
        await sendTextMessage(msg);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendTextMessage(input.trim());
            setInput("");
        }
    };

    const currentMicLabel =
        microphones.find((m) => m.deviceId === selectedMicrophoneId)?.label ??
        (microphones[0]?.label ?? "Default microphone");

    return (
        <>
            {/* ── Side tab ─────────────────────────────────────────────────────── */}
            <button
                type="button"
                onClick={toggleSidebar}
                title={isSidebarOpen ? "Close assistant" : "Chat with Crumb"}
                aria-label={isSidebarOpen ? "Close assistant" : "Chat with Crumb"}
                className={`
                    fixed top-1/2 z-[81] -translate-y-1/2
                    flex flex-col items-center gap-1.5
                    rounded-l-2xl px-2.5 py-5 shadow-lg select-none
                    transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                    bg-[#1B3329] hover:bg-[#243D34] text-white
                    ${isSidebarOpen ? "right-[22rem]" : "right-0"}
                `}
            >
                {isConnecting ? (
                    <Loader2 size={16} className="animate-spin text-white/70" />
                ) : (
                    <Mic size={16} className={isActive ? "text-emerald-400" : "text-white/70"} />
                )}
                <span
                    className="text-[10px] font-bold uppercase tracking-widest text-white/80"
                    style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                >
                    Crumb
                </span>
                {isActive && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ring-1 ring-[#1B3329]" />
                )}
            </button>

            {/* ── Main panel ───────────────────────────────────────────────────── */}
            <aside
                className={`
                    fixed right-0 top-0 z-[80] flex h-full w-[22rem] flex-col
                    shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${isSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}
                `}
                style={{ backgroundColor: "#1B3329" }}
            >
                {/* ── Header ─────────────────────────────────────────────────── */}
                <div
                    className="flex shrink-0 items-center justify-between px-4 py-3"
                    style={{ backgroundColor: "#162A22" }}
                >
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700/60 ring-1 ring-emerald-500/40">
                            <Mic size={15} className="text-emerald-300" />
                            {isActive && (
                                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse ring-1 ring-[#162A22]" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-none">Crumb</p>
                            <p className="mt-0.5 text-[11px] text-white/50">
                                {isConnecting
                                    ? "Connecting…"
                                    : isActive
                                        ? isSpeaking
                                            ? "Speaking…"
                                            : "Listening…"
                                        : isEscalated
                                            ? "Human agent joining…"
                                            : "AI Bakery Assistant"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Mic picker toggle */}
                        <button
                            type="button"
                            onClick={() => setShowMicPicker((v) => !v)}
                            title="Change microphone"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white/70"
                        >
                            <MicOff size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={closeSidebar}
                            title="Close"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white/70"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* ── Mic picker (collapsible) ────────────────────────────────── */}
                {showMicPicker && (
                    <div className="shrink-0 border-b border-white/5 px-4 py-2.5" style={{ backgroundColor: "#162A22" }}>
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/40">
                            Microphone
                        </p>
                        <select
                            value={selectedMicrophoneId}
                            onChange={(e) => void setMicrophoneDevice(e.currentTarget.value)}
                            disabled={microphones.length === 0}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500/50 disabled:opacity-60"
                        >
                            {microphones.length === 0 ? (
                                <option value="">No microphones found</option>
                            ) : (
                                microphones.map((d) => (
                                    <option key={d.deviceId} value={d.deviceId}>
                                        {d.label}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}

                {/* ── Chat / content area ─────────────────────────────────────── */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-2 px-4 py-4"
                    style={{ scrollBehavior: "smooth" }}
                >
                    {/* Idle / welcome state */}
                    {isIdle && messages.length === 0 && (
                        <div className="flex flex-col items-center gap-4 pt-6 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-800/40 ring-1 ring-emerald-700/40">
                                <Mic size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Hi, I&apos;m Crumb!</p>
                                <p className="mt-1.5 text-sm text-white/50 leading-relaxed">
                                    Your AI bakery assistant. Ask me about today&apos;s menu,
                                    allergens, or let me help you build the perfect order.
                                </p>
                            </div>
                            {/* Suggestion chips */}
                            <div className="flex flex-col w-full gap-2 pt-2">
                                {SUGGESTION_CHIPS.map((chip) => (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => void sendTextMessage(chip)}
                                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-left text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat history */}
                    {messages.map((m) => (
                        <ChatBubble key={m.id} msg={m} />
                    ))}

                    {/* Live partial transcript */}
                    {liveTranscript && liveTranscript.content.trim() && (
                        <LiveBubble live={liveTranscript} />
                    )}

                    {/* Speaking / thinking indicator */}
                    {isActive && isSpeaking && !liveTranscript && <TypingIndicator />}

                    {/* Proposal cards */}
                    {pendingProposal && (
                        <div className="rounded-2xl bg-[#162A22] p-4 ring-1 ring-emerald-800/40">
                            <ProposalCards
                                proposal={pendingProposal}
                                onApprove={approveProposal}
                                onReject={rejectProposal}
                            />
                        </div>
                    )}
                </div>

                {/* ── Footer / controls ───────────────────────────────────────── */}
                <div
                    className="shrink-0 px-4 pt-3 pb-4 space-y-3"
                    style={{ backgroundColor: "#111D18" }}
                >
                    {/* Text input */}
                    <form onSubmit={(e) => void handleSubmit(e)} className="flex items-end gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isEscalated ? "Human agent joining…" : "Type a message…"}
                            rows={1}
                            disabled={isEscalated}
                            className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-600/50 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isEscalated}
                            className="h-10 shrink-0 rounded-full bg-emerald-700 px-4 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Send
                        </button>
                    </form>

                    {/* Call controls or Start button */}
                    {isActive ? (
                        <div className="flex items-center gap-2">
                            {/* Waveform */}
                            <div className="flex flex-1 items-center justify-center">
                                <Waveform active={isSpeaking} />
                            </div>
                            <button
                                type="button"
                                onClick={toggleMute}
                                title={isMuted ? "Unmute" : "Mute"}
                                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${isMuted
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                                    }`}
                            >
                                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                            <button
                                type="button"
                                onClick={endCall}
                                title="End call"
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
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
                                h-11 rounded-full text-sm font-semibold text-white
                                transition-all active:scale-95
                                ${isConnecting
                                    ? "bg-emerald-800/50 cursor-not-allowed"
                                    : isEscalated
                                        ? "bg-blue-800/50 cursor-not-allowed"
                                        : "bg-emerald-700 hover:bg-emerald-600"
                                }
                            `}
                        >
                            {isConnecting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Mic size={16} />
                            )}
                            {isConnecting
                                ? "Connecting…"
                                : isEscalated
                                    ? "Human agent joining…"
                                    : "Start voice chat"}
                        </button>
                    )}

                    {/* Mic label hint */}
                    {!showMicPicker && (
                        <p className="text-center text-[10px] text-white/25 truncate px-2">
                            {currentMicLabel}
                        </p>
                    )}
                </div>
            </aside>
        </>
    );
}


