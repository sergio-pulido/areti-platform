"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "I am your Socratic companion. Tell me what challenge you are facing, and I will answer through Stoic-Epicurean balance with insights from Taoism and Buddhism.",
  },
];

export function ChatSimulator() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt) {
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const payload = (await response.json()) as { answer?: string; error?: string };
      const answer = payload.answer;

      if (!response.ok || !answer) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: payload.error ?? "I could not process that request. Please try again.",
          },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-night-800 bg-night-900/70 p-5">
      <div className="h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-night-800/80 bg-night-950/70 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === "assistant"
                ? "bg-night-900 text-sand-100"
                : "ml-auto bg-sage-500/20 text-sage-100"
            }`}
          >
            {message.content}
          </div>
        ))}
        {pending ? (
          <div className="max-w-[90%] rounded-2xl bg-night-900 px-4 py-3 text-sm text-night-200">
            Thinking through first principles...
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about anxiety, habits, ambition, love, purpose..."
          className="flex-1 rounded-xl border border-night-700 bg-night-950 px-4 py-3 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-medium text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
