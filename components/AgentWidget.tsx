"use client";

import { useCallback, useMemo, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Loader2, ChevronDown, X } from "lucide-react";
import { useAgent, type ChatMessage } from "@/context/AgentContext";
import { Persona, type PersonaState } from "@/components/ai-elements/persona";
import {
  MicSelector,
  MicSelectorContent,
  MicSelectorEmpty,
  MicSelectorInput,
  MicSelectorItem,
  MicSelectorLabel,
  MicSelectorList,
  MicSelectorTrigger,
} from "@/components/ai-elements/mic-selector";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPersonaState(
  status: "idle" | "connecting" | "active" | "escalated",
  isSpeaking: boolean
): PersonaState {
  if (status === "idle" || status === "escalated") return "idle";
  if (status === "connecting") return "thinking";
  if (status === "active") return isSpeaking ? "speaking" : "listening";
  return "idle";
}

function getConvoLine(
  liveTranscript: { role: "user" | "assistant"; content: string } | null,
  messages: ChatMessage[],
  status: string,
  isSpeaking: boolean
): string {
  if (liveTranscript?.content.trim()) {
    const who = liveTranscript.role === "user" ? "You" : "Crumb";
    return `${who}: ${liveTranscript.content.trim()}`;
  }
  if (messages.length > 0) {
    const last = messages[messages.length - 1];
    const who = last.role === "user" ? "You" : "Crumb";
    return `${who}: ${last.content}`;
  }
  if (status === "connecting") return "Connecting…";
  if (status === "active") return isSpeaking ? "Speaking…" : "Listening…";
  if (status === "escalated") return "Human agent joining…";
  return "Hi, I'm Crumb — ask me anything.";
}

// ── Floating bar (only UI) ────────────────────────────────────────────────────

const btnBase =
  "rounded-full transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900";

export default function AgentWidget() {
  const {
    status,
    isSpeaking,
    isMuted,
    messages,
    liveTranscript,
    startCall,
    endCall,
    toggleMute,
    selectedMicrophoneId,
    setMicrophoneDevice,
  } = useAgent();

  const isConnecting = status === "connecting";
  const isActive = status === "active";
  const isEscalated = status === "escalated";

  const [isExpanded, setIsExpanded] = useState(false);
  const personaState = useMemo(
    () => getPersonaState(status, isSpeaking),
    [status, isSpeaking]
  );
  const convoLine = useMemo(
    () => getConvoLine(liveTranscript, messages, status, isSpeaking),
    [liveTranscript, messages, status, isSpeaking]
  );

  const playOpenSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      const ctx = new AudioContextCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = "sine";
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.12);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
      osc.onended = () => {
        void ctx.close();
      };
    } catch {
      return;
    }
  }, []);

  const handleOpen = useCallback(() => {
    playOpenSound();
    setIsExpanded(true);
  }, [playOpenSound]);

  return (
    <TooltipProvider delayDuration={120}>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "fixed bottom-6 right-6 z-81",
          "size-14 rounded-full border border-white/10 bg-zinc-900/95",
          "text-white shadow-lg backdrop-blur-md",
          "flex items-center justify-center",
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
          isExpanded
            ? "pointer-events-none opacity-0 scale-95"
            : "opacity-100 scale-100"
        )}
        aria-label="Open Crumb"
      >
        <span className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-50" />
        <Mic className="relative size-6" />
      </button>

      <div
        className={cn(
          "fixed bottom-3 z-81 w-[calc(100vw-1rem)] max-w-[17rem] sm:w-[17rem]",
          "rounded-xl border border-white/5 bg-zinc-900/95 shadow-lg backdrop-blur-sm",
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isExpanded
            ? "left-1/2 -translate-x-1/2 opacity-100 scale-100 translate-y-0"
            : "right-6 left-auto translate-x-6 translate-y-2 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div
          className="flex items-center justify-between gap-1 px-2 pt-1.5 pb-0.5"
        >
          <p
            className="flex-1 min-w-0 truncate text-center text-[11px] text-white/60"
            title={convoLine}
          >
            {convoLine}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
            className={cn(
              btnBase,
              "size-6 shrink-0 text-white/40 hover:bg-white/5 hover:text-white/60"
            )}
            aria-label="Close"
          >
            <X className="size-3" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1 px-2 pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={
                  isConnecting || isEscalated
                    ? undefined
                    : isActive
                      ? endCall
                      : startCall
                }
                disabled={isConnecting || isEscalated}
                className={cn(
                  btnBase,
                  "size-8 text-white/80 hover:bg-white/10 hover:text-white",
                  isActive && "bg-white/10 text-white"
                )}
                aria-label={isActive ? "End call" : "Call"}
              >
                {isConnecting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : isActive ? (
                  <PhoneOff className="size-3.5" />
                ) : (
                  <Phone className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              {isConnecting ? "Connecting…" : isActive ? "End call" : "Call"}
            </TooltipContent>
          </Tooltip>

          <MicSelector
            value={selectedMicrophoneId || undefined}
            onValueChange={(id) => id && setMicrophoneDevice(id)}
          >

            <MicSelectorTrigger
              variant="ghost"
              size="icon"
              className={cn(
                btnBase,
                "size-8 text-white/50 hover:bg-white/5 hover:text-white/70"
              )}
              aria-label="Input device"
            >

            </MicSelectorTrigger>


            <MicSelectorContent
              className="p-1"
              popoverOptions={{
                side: "top",
                align: "center",
                className: "w-auto min-w-[11rem] p-0 rounded-md",
                style: { width: "11rem", minWidth: "11rem" },
              }}
            >
              <MicSelectorInput className="h-7 px-2 py-1 text-xs" />
              <MicSelectorList className="max-h-48 p-0.5">
                {(devices) =>
                  devices.length === 0 ? (
                    <MicSelectorEmpty className="py-2 text-[11px]" />
                  ) : (
                    devices.map((device) => (
                      <MicSelectorItem
                        key={device.deviceId}
                        value={device.deviceId}
                        className="rounded px-2 py-1.5 text-[11px]"
                      >
                        <MicSelectorLabel device={device} />
                      </MicSelectorItem>
                    ))
                  )
                }
              </MicSelectorList>
            </MicSelectorContent>
          </MicSelector>

          <div className="flex shrink-0 items-center justify-center" aria-hidden>
            <Persona className="size-16" state={personaState} variant="halo" />
          </div>

          {isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={cn(
                    btnBase,
                    "size-8",
                    isMuted
                      ? "text-white/70 hover:bg-white/5 hover:text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white/70"
                  )}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <MicOff className="size-3.5" />
                  ) : (
                    <Mic className="size-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px]">
                {isMuted ? "Unmute" : "Mute"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
