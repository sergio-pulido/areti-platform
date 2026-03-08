import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ChatMessage } from "@/components/chat/types";

type ChatConversationProps = {
  messages: ChatMessage[];
  pending: boolean;
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatConversation({ messages, pending }: ChatConversationProps) {
  return (
    <Card
      variant="muted"
      className="flex h-[58vh] min-h-[420px] flex-col overflow-hidden rounded-[var(--radius-2xl)] p-0"
    >
      <div className="border-b border-night-800 px-5 py-3">
        <Badge variant="muted">Companion session</Badge>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === "assistant"
                ? "bg-night-900 text-sand-100"
                : "ml-auto border border-sage-300/30 bg-sage-500/20 text-sage-100"
            }`}
          >
            <p>{message.content}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.08em] text-night-300">
              {message.role === "assistant" ? "Companion" : "You"} ·{" "}
              {formatTimestamp(message.createdAt)}
            </p>
          </article>
        ))}

        {pending ? (
          <article className="max-w-[92%] rounded-2xl bg-night-900 px-4 py-3 text-sm text-night-200">
            Thinking through first principles...
          </article>
        ) : null}
      </div>
    </Card>
  );
}
