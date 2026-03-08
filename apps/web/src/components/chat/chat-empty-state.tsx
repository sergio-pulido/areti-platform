"use client";

import { MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/cn";

type ChatEmptyStateProps = {
  prompts?: string[];
  onUsePrompt?: (prompt: string) => void;
};

const DEFAULT_PROMPTS = [
  "I feel anxious and scattered. Help me settle in the next 10 minutes.",
  "Help me think clearly through a difficult decision.",
  "Guide a short evening reflection I can do tonight.",
  "I want to improve one relationship without losing myself.",
];

export function ChatEmptyState({ prompts = DEFAULT_PROMPTS, onUsePrompt }: ChatEmptyStateProps) {
  return (
    <section className="rounded-[var(--radius-2xl)] border border-night-800/65 bg-night-950/40 px-5 py-6 sm:px-6">
      <h2 className="text-xl font-semibold text-sand-100">Begin where you are</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-night-200">
        Write one honest sentence, or start with one of these prompts.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onUsePrompt?.(prompt)}
            className={cn(
              "group flex items-start gap-2 rounded-xl border border-night-800/65 bg-night-950/50 px-3 py-2.5 text-left transition",
              "hover:border-sage-300/35 hover:bg-sage-500/10",
            )}
          >
            <MessageCircleQuestion
              size={14}
              className="mt-0.5 shrink-0 text-night-300 transition group-hover:text-sage-200"
            />
            <span className="text-sm text-night-100">{prompt}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
