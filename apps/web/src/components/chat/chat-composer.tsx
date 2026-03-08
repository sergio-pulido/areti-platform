"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CornerDownLeft, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

type ChatComposerProps = {
  value: string;
  pending: boolean;
  disabled?: boolean;
  continuePrompt?: string | null;
  focusSignal?: number;
  onChange: (value: string) => void;
  onSend: () => void;
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

export function ChatComposer({
  value,
  pending,
  disabled = false,
  continuePrompt = null,
  focusSignal,
  onChange,
  onSend,
}: ChatComposerProps) {
  const [mode, setMode] = useState<ComposerModeId>("reflect");
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
    <section className="sticky bottom-2 z-10 mt-3 space-y-2 rounded-[var(--radius-xl)] border border-night-700/70 bg-night-900/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MODE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id)}
            disabled={disabled}
            aria-pressed={option.id === mode}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-50",
              option.id === mode
                ? "border-sage-300/45 bg-sage-500/15 text-sage-100"
                : "border-night-700/80 bg-night-950/70 text-night-200 hover:border-night-600",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-night-300">
        <span>Starter:</span>
        <button
          type="button"
          onClick={() => applySuggestion(activeMode.suggestion)}
          disabled={disabled || pending}
          className="max-w-full rounded-full border border-night-700/70 bg-night-950/55 px-3 py-1 text-left text-night-200 transition hover:border-sage-300/40 hover:text-sage-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {activeMode.suggestion}
        </button>

        {continuePrompt ? (
          <button
            type="button"
            onClick={() => applySuggestion(continuePrompt)}
            disabled={disabled || pending}
            className="max-w-full rounded-full border border-sage-300/35 bg-sage-500/10 px-3 py-1 text-left text-sage-100 transition hover:bg-sage-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue last topic
          </button>
        ) : null}
      </div>

      <label htmlFor="chat-prompt" className="sr-only">
        Chat prompt
      </label>

      <Textarea
        id="chat-prompt"
        ref={textareaRef}
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={activeMode.placeholder}
        className="resize-none border-night-600/80 bg-night-950/75 leading-relaxed focus:border-sage-300/80"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1 text-xs text-night-300">
          <CornerDownLeft size={12} />
          Shift+Enter for newline
        </p>

        <Button
          variant="primary"
          size="md"
          disabled={pending || disabled || !value.trim()}
          onClick={onSend}
          aria-label="Send chat message"
          className="shrink-0"
        >
          <SendHorizontal size={14} />
          Send
        </Button>
      </div>
    </section>
  );
}
