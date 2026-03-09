"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Loader2, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/components/chat/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

type ChatConversationProps = {
  messages: ChatMessage[];
  pending: boolean;
  loading?: boolean;
  onFollowUpSelect?: (prompt: string) => void;
  className?: string;
};

type AssistantStructure = {
  insight: string | null;
  keyPoints: string[];
  practicalAction: string | null;
  followUpQuestion: string | null;
  additionalParagraphs: string[];
};

const FOLLOW_UP_OPTIONS = [
  {
    label: "Explore deeper",
    prompt: "Explore this deeper and challenge my assumptions.",
  },
  {
    label: "Make it practical",
    prompt: "Make this practical with 3 concrete steps I can do this week.",
  },
  {
    label: "Give me an exercise",
    prompt: "Give me a short reflective exercise based on this.",
  },
  {
    label: "Help me journal",
    prompt: "Turn this into a clear journaling flow for tonight.",
  },
] as const;

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function splitParagraphs(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function cleanInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function parseBulletParagraph(paragraph: string): string[] | null {
  const lines = paragraph
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0 || !lines.every((line) => /^([-*•]|\d+\.)\s+/.test(line))) {
    return null;
  }

  const points = lines
    .map((line) => cleanInlineMarkdown(line.replace(/^([-*•]|\d+\.)\s+/, "")))
    .filter(Boolean);

  return points.length > 0 ? points : null;
}

function deriveAssistantStructure(content: string): AssistantStructure {
  const paragraphs = splitParagraphs(content);
  const keyPoints: string[] = [];
  const narrativeParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    const bulletPoints = parseBulletParagraph(paragraph);
    if (bulletPoints) {
      keyPoints.push(...bulletPoints);
      continue;
    }

    narrativeParagraphs.push(cleanInlineMarkdown(paragraph.replace(/\n+/g, " ")));
  }

  const insight = narrativeParagraphs.shift() ?? null;

  let followUpQuestion: string | null = null;
  if (narrativeParagraphs.length > 0) {
    const maybeQuestion = narrativeParagraphs[narrativeParagraphs.length - 1] ?? "";
    if (maybeQuestion.trim().endsWith("?")) {
      followUpQuestion = narrativeParagraphs.pop() ?? null;
    }
  }

  const practicalIndex = narrativeParagraphs.findIndex((paragraph) =>
    /\b(try|practice|step|today|tomorrow|this week|exercise|journal|commit)\b/i.test(paragraph),
  );

  let practicalAction: string | null = null;
  if (practicalIndex >= 0) {
    practicalAction = narrativeParagraphs.splice(practicalIndex, 1)[0] ?? null;
  }

  return {
    insight,
    keyPoints,
    practicalAction,
    followUpQuestion,
    additionalParagraphs: narrativeParagraphs,
  };
}

function AssistantMessageBody({ content }: { content: string }) {
  const structured = deriveAssistantStructure(content);

  return (
    <div className="space-y-3 text-[15px] leading-7 text-night-100">
      {structured.insight ? <p className="text-sand-100">{structured.insight}</p> : null}

      {structured.keyPoints.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 marker:text-sage-300">
          {structured.keyPoints.map((point, index) => (
            <li key={`${index}-${point.slice(0, 24)}`}>{point}</li>
          ))}
        </ul>
      ) : null}

      {structured.practicalAction ? (
        <p className="rounded-xl border border-sage-300/30 bg-sage-500/10 px-3 py-2.5 text-sage-100">
          {structured.practicalAction}
        </p>
      ) : null}

      {structured.additionalParagraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}

      {structured.followUpQuestion ? (
        <p className="border-l-2 border-sage-300/40 pl-3 italic text-sage-100">{structured.followUpQuestion}</p>
      ) : null}
    </div>
  );
}

export function ChatConversation({
  messages,
  pending,
  loading = false,
  onFollowUpSelect,
  className,
}: ChatConversationProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const forceInstantScrollRef = useRef(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const lastAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "assistant") {
        return messages[index]?.id ?? null;
      }
    }

    return null;
  }, [messages]);

  useEffect(() => {
    if (loading) {
      // New thread/session payload should always open at the most recent message.
      shouldStickToBottomRef.current = true;
      forceInstantScrollRef.current = true;
    }
  }, [loading]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || loading || !shouldStickToBottomRef.current) {
      return;
    }

    const behavior = forceInstantScrollRef.current ? "auto" : "smooth";
    scroller.scrollTo({ top: scroller.scrollHeight, behavior });
    forceInstantScrollRef.current = false;
  }, [loading, messages.length, pending]);

  return (
    <section
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-night-800/60 bg-night-950/35",
        className,
      )}
    >
      <div
        ref={scrollerRef}
        data-testid="chat-conversation-scroller"
        onScroll={(event) => {
          const element = event.currentTarget;
          const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
          const isNearBottom = remaining < 96;
          shouldStickToBottomRef.current = isNearBottom;
          setShowJumpToLatest(!isNearBottom);
        }}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4"
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="max-w-[80%] space-y-2 rounded-2xl border border-night-800/60 bg-night-900/50 px-4 py-3"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
              </div>
            ))}
          </div>
        ) : (
          messages.map((message) => {
            const isAssistant = message.role === "assistant";
            const isLatestAssistant = isAssistant && message.id === lastAssistantMessageId;

            return (
              <article
                key={message.id}
                className={cn(
                  "break-words rounded-2xl px-4 py-3",
                  isAssistant
                    ? "max-w-[min(100%,78ch)] bg-night-900/65"
                    : "ml-auto max-w-[min(100%,66ch)] border border-sage-300/20 bg-sage-500/12",
                )}
              >
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-night-300">
                  {isAssistant ? <Sparkles size={12} className="text-sage-200" /> : null}
                  {isAssistant ? "Companion" : "You"} · {formatTimestamp(message.createdAt)}
                </div>

                {isAssistant ? (
                  <AssistantMessageBody content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-sage-100">
                    {message.content}
                  </p>
                )}

                {isLatestAssistant && !pending && onFollowUpSelect ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {FOLLOW_UP_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => onFollowUpSelect(option.prompt)}
                        className="max-w-full rounded-full border border-night-700/70 bg-night-950/45 px-3 py-1 text-left text-xs text-night-200 transition hover:border-sage-300/40 hover:text-sage-100"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        )}

        {pending ? (
          <article className="max-w-[min(100%,78ch)] rounded-2xl bg-night-900/60 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-night-300">
              <Sparkles size={12} className="text-sage-200" />
              Companion
            </div>
            <p className="flex items-center gap-2 text-sm text-night-200">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </p>
          </article>
        ) : null}
      </div>

      {showJumpToLatest ? (
        <button
          type="button"
          onClick={() => {
            const scroller = scrollerRef.current;
            if (!scroller) {
              return;
            }
            shouldStickToBottomRef.current = true;
            setShowJumpToLatest(false);
            scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
          }}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-sage-300/45 bg-night-900/95 px-3 py-1 text-xs text-sage-100 shadow-lg transition hover:bg-night-900"
          aria-label="Jump to latest message"
        >
          <ArrowDown size={12} />
          Latest
        </button>
      ) : null}
    </section>
  );
}
