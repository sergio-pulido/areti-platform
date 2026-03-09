"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { RotateCcw } from "lucide-react";
import { ChatConversation } from "@/components/chat/chat-conversation";
import type { ChatMessage } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackPreviewEvent } from "@/lib/preview-analytics";

const TOTAL_TOKEN_BUDGET = 220;
const MAX_PROMPT_TOKENS = 72;
const MAX_RESPONSE_TOKENS = 96;
const MIN_RESPONSE_TOKENS = 18;
const APPROX_CHARS_PER_TOKEN = 4;

const STARTER_PROMPTS = [
  "Help me reframe a frustrating situation in one paragraph.",
  "Give me a practical 3-step plan to calm down before a hard conversation.",
  "Ask me two focused questions so I can make a clearer decision today.",
] as const;

const WELCOME_MESSAGE =
  "Token-limited preview is active. You have a fixed budget for this session, so keep prompts concise.";

function estimateTokens(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return Math.ceil(trimmed.length / APPROX_CHARS_PER_TOKEN);
}

function truncateToTokenLimit(value: string, maxTokens: number): { content: string; truncated: boolean } {
  const estimated = estimateTokens(value);
  if (estimated <= maxTokens) {
    return { content: value, truncated: false };
  }

  const maxChars = Math.max(maxTokens * APPROX_CHARS_PER_TOKEN, 8);
  return {
    content: `${value.slice(0, maxChars).trimEnd()}…`,
    truncated: true,
  };
}

type PreviewPayload = {
  answer?: string;
  error?: string;
};

async function requestPreviewAnswer(
  prompt: string,
  endpoint: string,
  maxResponseTokens: number,
): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxResponseTokens }),
  });

  const payload = (await response.json().catch(() => ({}))) as PreviewPayload;

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to complete preview chat request.");
  }

  if (typeof payload.answer !== "string" || payload.answer.trim().length === 0) {
    throw new Error("Preview response was empty.");
  }

  return payload.answer;
}

function buildMessage(id: string, role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id,
    threadId: "preview-thread",
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

type TokenLimitedPreviewProps = {
  endpoint?: string;
  analyticsPath?: string;
};

export function TokenLimitedPreview({ endpoint = "/api/chat", analyticsPath }: TokenLimitedPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    buildMessage("preview-welcome", "assistant", WELCOME_MESSAGE),
  ]);
  const [prompt, setPrompt] = useState("");
  const [usedTokens, setUsedTokens] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingTokens = Math.max(TOTAL_TOKEN_BUDGET - usedTokens, 0);
  const promptTokens = estimateTokens(prompt);

  const helperText = useMemo(() => {
    if (!prompt.trim()) {
      return "Write a short prompt and send.";
    }

    if (promptTokens > MAX_PROMPT_TOKENS) {
      return `Prompt too long: ${promptTokens}/${MAX_PROMPT_TOKENS} tokens.`;
    }

    if (remainingTokens < MIN_RESPONSE_TOKENS + promptTokens) {
      return "Budget too low for another full turn. Reset to continue.";
    }

    return `Prompt estimate: ${promptTokens}/${MAX_PROMPT_TOKENS} tokens.`;
  }, [prompt, promptTokens, remainingTokens]);

  const canSend =
    !pending &&
    prompt.trim().length >= 3 &&
    promptTokens <= MAX_PROMPT_TOKENS &&
    remainingTokens >= MIN_RESPONSE_TOKENS + promptTokens;

  async function handleSend(nextPrompt: string): Promise<void> {
    const normalized = nextPrompt.trim();
    if (!normalized) {
      return;
    }

    const inputTokens = estimateTokens(normalized);
    if (inputTokens > MAX_PROMPT_TOKENS) {
      setError(`Prompt exceeds ${MAX_PROMPT_TOKENS} token limit.`);
      return;
    }

    const availableOutputTokens = Math.min(MAX_RESPONSE_TOKENS, remainingTokens - inputTokens);
    if (availableOutputTokens < MIN_RESPONSE_TOKENS) {
      setError("Not enough tokens left for a useful response. Reset preview to continue.");
      return;
    }

    setPending(true);
    setError(null);
    setMessages((current) => [...current, buildMessage(`user-${Date.now()}`, "user", normalized)]);
    setPrompt("");
    if (analyticsPath) {
      trackPreviewEvent({
        eventType: "preview_chat_prompt_submitted",
        path: analyticsPath,
        metadata: {
          tokens: inputTokens.toString(),
        },
      });
    }

    try {
      const rawAnswer = await requestPreviewAnswer(normalized, endpoint, availableOutputTokens);
      const limited = truncateToTokenLimit(rawAnswer, availableOutputTokens);
      const outputTokens = estimateTokens(limited.content);

      setMessages((current) => [
        ...current,
        buildMessage(
          `assistant-${Date.now()}`,
          "assistant",
          limited.truncated
            ? `${limited.content}\n\n[preview note] Response clipped due to token budget.`
            : limited.content,
        ),
      ]);

      setUsedTokens((current) => Math.min(TOTAL_TOKEN_BUDGET, current + inputTokens + outputTokens));
      if (analyticsPath) {
        trackPreviewEvent({
          eventType: "preview_chat_response_received",
          path: analyticsPath,
          metadata: {
            tokens: outputTokens.toString(),
          },
        });
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send preview prompt.");
    } finally {
      setPending(false);
    }
  }

  function resetPreview(): void {
    setMessages([buildMessage(`preview-reset-${Date.now()}`, "assistant", WELCOME_MESSAGE)]);
    setPrompt("");
    setUsedTokens(0);
    setError(null);
    setPending(false);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (canSend) {
      void handleSend(prompt);
    }
  }

  return (
    <div className="space-y-3">
      <section className="rounded-[var(--radius-xl)] border border-night-800/70 bg-night-900/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-night-200">
            Token budget: <span className="text-sand-100">{remainingTokens}</span> / {TOTAL_TOKEN_BUDGET} remaining
          </p>
          <Button variant="ghost" size="sm" onClick={resetPreview} className="h-8" aria-label="Reset preview chat">
            <RotateCcw size={13} />
            Reset
          </Button>
        </div>
        <p className="mt-2 text-xs text-night-300">
          Limits per turn: input ≤ {MAX_PROMPT_TOKENS}, response ≤ {MAX_RESPONSE_TOKENS} (estimated tokens).
        </p>
      </section>

      <ChatConversation messages={messages} pending={pending} />

      <section className="space-y-2 rounded-[var(--radius-xl)] border border-night-700/80 bg-night-900/90 p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-night-300">
          <span>Try:</span>
          {STARTER_PROMPTS.map((starter) => (
            <button
              key={starter}
              type="button"
              disabled={pending}
              onClick={() => setPrompt(starter)}
              className="max-w-full rounded-full border border-night-700/80 bg-night-950/65 px-3 py-1 text-left text-night-200 transition hover:border-sage-300/40 hover:text-sage-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starter}
            </button>
          ))}
        </div>

        <Textarea
          value={prompt}
          rows={3}
          onKeyDown={handleComposerKeyDown}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Write a concise prompt (Shift+Enter for newline)."
          className="resize-none border-night-600/80 bg-night-950/75 leading-relaxed focus:border-sage-300/80"
          disabled={pending}
          maxLength={800}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-night-300">{helperText}</p>
          <Button variant="primary" size="md" disabled={!canSend} onClick={() => void handleSend(prompt)}>
            Send
          </Button>
        </div>

        {error ? <p className="text-xs text-amber-300">{error}</p> : null}
      </section>
    </div>
  );
}
