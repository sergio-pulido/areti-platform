import { KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatComposerProps = {
  value: string;
  pending: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function ChatComposer({
  value,
  pending,
  disabled = false,
  onChange,
  onSend,
}: ChatComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (!pending && !disabled && value.trim()) {
      onSend();
    }
  }

  return (
    <div className="sticky bottom-0 mt-4 rounded-[var(--radius-xl)] border border-night-700 bg-night-900/85 p-3 backdrop-blur">
      <label htmlFor="chat-prompt" className="sr-only">
        Chat prompt
      </label>
      <Textarea
        id="chat-prompt"
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about anxiety, habits, ambition, purpose, or relationships..."
        className="resize-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-night-300">Enter to send, Shift+Enter for newline</p>
        <Button
          variant="primary"
          size="md"
          disabled={pending || disabled || !value.trim()}
          onClick={onSend}
          aria-label="Send chat message"
        >
          <SendHorizontal size={14} />
          Send
        </Button>
      </div>
    </div>
  );
}
