"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CornerDownLeft, Paperclip, SendHorizontal, Sparkles } from "lucide-react";
import type { ChatContextTelemetry } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

type ChatComposerProps = {
  value: string;
  pending: boolean;
  disabled?: boolean;
  continuePrompt?: string | null;
  focusSignal?: number;
  context?: ChatContextTelemetry | null;
  contextSummaryTimestamp?: string | null;
  summarizePending?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onSummarizeContext?: () => void;
};

const MODE_OPTIONS = [
  {
    id: "reflect",
    label: "Reflect",
    placeholder: "What feels most difficult right now?",
    suggestion: "I feel anxious and scattered. Help me settle and think clearly.",
  },
  {
    id: "ask",
    label: "Ask",
    placeholder: "Ask one direct question.",
    suggestion: "What would a Stoic lens suggest for this situation?",
  },
  {
    id: "journal",
    label: "Journal",
    placeholder: "Turn this moment into a short reflection.",
    suggestion: "Guide a five-minute evening journal reflection for today.",
  },
  {
    id: "decide",
    label: "Decide",
    placeholder: "Clarify options and next step.",
    suggestion: "Help me decide between these options without overthinking.",
  },
] as const;

type ComposerModeId = (typeof MODE_OPTIONS)[number]["id"];

function contextStateLabel(state: ChatContextTelemetry["state"]): string {
  if (state === "warning") {
    return "Warning";
  }
  if (state === "degraded") {
    return "Degraded";
  }
  return "Healthy";
}

function contextChipClass(state: ChatContextTelemetry["state"]): string {
  if (state === "warning") {
    return "border-amber-300/45 bg-amber-500/15 text-amber-100";
  }
  if (state === "degraded") {
    return "border-rose-400/50 bg-rose-500/15 text-rose-100";
  }
  return "border-sage-300/45 bg-sage-500/15 text-sage-100";
}

function contextProgressClass(state: ChatContextTelemetry["state"]): string {
  if (state === "warning") {
    return "bg-amber-300/80";
  }
  if (state === "degraded") {
    return "bg-rose-400/80";
  }
  return "bg-sage-300/80";
}

function contextStateTextClass(state: ChatContextTelemetry["state"]): string {
  if (state === "warning") {
    return "text-amber-100";
  }
  if (state === "degraded") {
    return "text-rose-100";
  }
  return "text-sage-100";
}

export function ChatComposer({
  value,
  pending,
  disabled = false,
  continuePrompt = null,
  focusSignal,
  context = null,
  contextSummaryTimestamp = null,
  summarizePending = false,
  onChange,
  onSend,
  onSummarizeContext,
}: ChatComposerProps) {
  const [mode, setMode] = useState<ComposerModeId>("reflect");
  const [modesOpen, setModesOpen] = useState(false);
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeMode = useMemo(
    () => MODE_OPTIONS.find((option) => option.id === mode) ?? MODE_OPTIONS[0],
    [mode],
  );

  useEffect(() => {
    if (focusSignal === undefined) {
      return;
    }

    textareaRef.current?.focus();
  }, [focusSignal]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (!pending && !disabled && value.trim()) {
      onSend();
    }
  }

  function applySuggestion(prompt: string): void {
    onChange(prompt);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <>
      <section className="mt-3 space-y-2 rounded-[var(--radius-xl)] border border-night-700/70 bg-night-900/90 p-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || pending}
            aria-label="Add attachment"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-night-700/80 bg-night-950/70 text-night-200 transition hover:border-night-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Paperclip size={14} />
          </button>

          <div className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setModesOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={modesOpen}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-night-700/80 bg-night-950/70 px-3 text-xs text-night-100 transition hover:border-night-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={12} className="text-sage-200" />
              {activeMode.label}
            </button>

            {modesOpen ? (
              <div className="absolute left-0 z-20 mt-2 w-44 rounded-xl border border-night-700/80 bg-night-900/95 p-1.5 shadow-2xl">
                {MODE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setMode(option.id);
                      setModesOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition",
                      option.id === mode
                        ? "bg-sage-500/15 text-sage-100"
                        : "text-night-100 hover:bg-night-800",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {continuePrompt ? (
            <button
              type="button"
              onClick={() => applySuggestion(continuePrompt)}
              disabled={disabled || pending}
              className="max-w-full rounded-full border border-sage-300/35 bg-sage-500/10 px-3 py-1 text-left text-xs text-sage-100 transition hover:bg-sage-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue last topic
            </button>
          ) : null}

          {!value.trim() ? (
            <button
              type="button"
              onClick={() => applySuggestion(activeMode.suggestion)}
              disabled={disabled || pending}
              className="max-w-full rounded-full border border-night-700/70 bg-night-950/55 px-3 py-1 text-left text-xs text-night-200 transition hover:border-sage-300/40 hover:text-sage-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use starter
            </button>
          ) : null}
        </div>

        <label htmlFor="chat-prompt" className="sr-only">
          Chat prompt
        </label>

        <Textarea
          id="chat-prompt"
          ref={textareaRef}
          rows={2}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeMode.placeholder}
          className="max-h-[40vh] min-h-[88px] resize-none rounded-2xl border-night-600/80 bg-night-950/75 leading-relaxed focus:border-sage-300/80"
        />

        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-xs text-night-300">
            <CornerDownLeft size={12} />
            Shift+Enter for newline
          </p>

          <div className="flex items-center gap-2">
            {context ? (
              <button
                type="button"
                onClick={() => setContextModalOpen(true)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-2.5 text-xs font-medium",
                  contextChipClass(context.state),
                )}
                aria-label="Open context usage details"
              >
                {context.usagePercent}%
              </button>
            ) : null}

            <Button
              variant="primary"
              size="md"
              disabled={pending || disabled || !value.trim()}
              onClick={onSend}
              aria-label="Send chat message"
              className="h-9 rounded-full px-3.5"
            >
              <SendHorizontal size={14} />
              Send
            </Button>
          </div>
        </div>
      </section>

      {context && contextModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-night-950/70 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Context usage details"
          onClick={() => setContextModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-night-700/80 bg-night-900/95 p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-sand-100">Context usage (estimated)</h3>
              <button
                type="button"
                onClick={() => setContextModalOpen(false)}
                className="rounded-lg border border-night-700/80 px-2 py-1 text-xs text-night-200 hover:border-night-600"
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <p className="text-night-200">
                {context.estimatedPromptTokens} / {context.contextCapacity} tokens ({context.usagePercent}%)
              </p>
              <p className={contextStateTextClass(context.state)}>
                State: {contextStateLabel(context.state)}
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-night-950">
              <div
                className={cn("h-full transition-all", contextProgressClass(context.state))}
                style={{ width: `${Math.min(100, Math.max(0, context.usagePercent))}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-night-300">
              {contextSummaryTimestamp ? `Last summary: ${contextSummaryTimestamp}` : "No summary yet"}
            </p>

            {onSummarizeContext ? (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onSummarizeContext}
                  disabled={pending || summarizePending || disabled}
                >
                  {summarizePending ? "Summarizing..." : "Summarize now"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
