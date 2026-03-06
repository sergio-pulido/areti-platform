"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type Thread = {
  id: string;
  userId: string;
  title: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ChatSimulatorProps = {
  initialPrompt?: string;
  initialThreadId?: string;
};

const WELCOME_MESSAGE = "I am your Socratic companion. Ask one practical question to start.";

function syntheticAssistantMessage(threadId: string): Message {
  return {
    id: "welcome",
    threadId,
    role: "assistant",
    content: WELCOME_MESSAGE,
    createdAt: new Date().toISOString(),
  };
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { data?: T; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  if (payload.data === undefined) {
    throw new Error("Missing response payload.");
  }

  return payload.data;
}

export function ChatSimulator({ initialPrompt, initialThreadId }: ChatSimulatorProps) {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consumedPromptRef = useRef<string | null>(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  async function loadThreadsAndSelect(): Promise<void> {
    const loadedThreads = await parseJsonOrThrow<Thread[]>(
      await fetch("/api/chat/threads", { method: "GET", cache: "no-store" }),
    );

    if (loadedThreads.length === 0) {
      const created = await parseJsonOrThrow<Thread>(
        await fetch("/api/chat/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Thread" }),
        }),
      );
      setThreads([created]);
      setActiveThreadId(created.id);
      return;
    }

    setThreads(loadedThreads);
    if (!activeThreadId || !loadedThreads.some((item) => item.id === activeThreadId)) {
      setActiveThreadId(initialThreadId && loadedThreads.some((t) => t.id === initialThreadId) ? initialThreadId : loadedThreads[0]?.id ?? null);
    }
  }

  async function loadMessages(threadId: string): Promise<void> {
    const loadedMessages = await parseJsonOrThrow<Message[]>(
      await fetch(`/api/chat/threads/${threadId}/messages`, { method: "GET", cache: "no-store" }),
    );
    setMessages(
      loadedMessages.length > 0 ? loadedMessages : [syntheticAssistantMessage(threadId)],
    );
  }

  async function createThread(): Promise<void> {
    setPending(true);
    setError(null);

    try {
      const created = await parseJsonOrThrow<Thread>(
        await fetch("/api/chat/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `Thread ${threads.length + 1}` }),
        }),
      );
      setThreads((prev) => [created, ...prev]);
      setActiveThreadId(created.id);
      setMessages([syntheticAssistantMessage(created.id)]);
      router.replace(`/dashboard/chat?thread=${created.id}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create thread.");
    } finally {
      setPending(false);
    }
  }

  async function renameThread(threadId: string): Promise<void> {
    const nextTitle = window.prompt("Thread title");
    if (!nextTitle) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      await parseJsonOrThrow<{ ok: true }>(
        await fetch(`/api/chat/threads/${threadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle.trim() }),
        }),
      );
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === threadId ? { ...thread, title: nextTitle.trim() } : thread,
        ),
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to rename thread.");
    } finally {
      setPending(false);
    }
  }

  async function archiveThread(threadId: string): Promise<void> {
    setPending(true);
    setError(null);

    try {
      await parseJsonOrThrow<{ ok: true }>(
        await fetch(`/api/chat/threads/${threadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: true }),
        }),
      );
      const nextThreads = threads.filter((thread) => thread.id !== threadId);
      setThreads(nextThreads);
      const nextActive = nextThreads[0]?.id ?? null;
      setActiveThreadId(nextActive);
      if (nextActive) {
        router.replace(`/dashboard/chat?thread=${nextActive}`);
      } else {
        await createThread();
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to archive thread.");
    } finally {
      setPending(false);
    }
  }

  async function deleteThread(threadId: string): Promise<void> {
    setPending(true);
    setError(null);

    try {
      await parseJsonOrThrow<{ ok: true }>(
        await fetch(`/api/chat/threads/${threadId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }),
      );
      const nextThreads = threads.filter((thread) => thread.id !== threadId);
      setThreads(nextThreads);
      const nextActive = nextThreads[0]?.id ?? null;
      setActiveThreadId(nextActive);
      if (nextActive) {
        router.replace(`/dashboard/chat?thread=${nextActive}`);
      } else {
        await createThread();
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete thread.");
    } finally {
      setPending(false);
    }
  }

  async function sendPrompt(prompt: string): Promise<void> {
    if (!activeThreadId || !prompt) {
      return;
    }

    setPending(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-user-${Date.now()}`,
        threadId: activeThreadId,
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");

    try {
      const payload = await parseJsonOrThrow<{ answer: string }>(
        await fetch(`/api/chat/threads/${activeThreadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }),
      );

      await loadMessages(activeThreadId);
      if (!payload.answer) {
        throw new Error("No response from assistant.");
      }
      await loadThreadsAndSelect();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send prompt.");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    void loadThreadsAndSelect().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load chat.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeThreadId) {
      return;
    }

    void loadMessages(activeThreadId).catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load messages.");
    });
    router.replace(`/dashboard/chat?thread=${activeThreadId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  useEffect(() => {
    if (!initialPrompt || !activeThreadId || consumedPromptRef.current === initialPrompt) {
      return;
    }

    consumedPromptRef.current = initialPrompt;
    void sendPrompt(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, activeThreadId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendPrompt(input.trim());
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-3xl border border-night-800 bg-night-900/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-night-300">Threads</p>
          <button
            type="button"
            onClick={createThread}
            className="rounded-lg border border-night-700 px-2 py-1 text-xs text-sand-100 hover:border-night-500"
          >
            New
          </button>
        </div>
        <div className="space-y-2">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`rounded-xl border p-2 ${
                thread.id === activeThreadId
                  ? "border-sage-300/50 bg-sage-500/10"
                  : "border-night-700 bg-night-950/70"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveThreadId(thread.id)}
                className="w-full text-left text-sm text-sand-100"
              >
                {thread.title}
              </button>
              <div className="mt-2 flex gap-1 text-[10px] text-night-300">
                <button type="button" onClick={() => renameThread(thread.id)} className="rounded border border-night-700 px-1.5 py-0.5 hover:border-night-500">
                  Rename
                </button>
                <button type="button" onClick={() => archiveThread(thread.id)} className="rounded border border-night-700 px-1.5 py-0.5 hover:border-night-500">
                  Archive
                </button>
                <button type="button" onClick={() => deleteThread(thread.id)} className="rounded border border-rose-400/40 px-1.5 py-0.5 text-rose-200 hover:bg-rose-500/10">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-night-800 bg-night-900/70 p-5">
        <div className="h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-night-800/80 bg-night-950/70 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
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
          <label htmlFor="chat-prompt" className="sr-only">
            Chat prompt
          </label>
          <input
            id="chat-prompt"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about anxiety, habits, ambition, love, purpose..."
            className="flex-1 rounded-xl border border-night-700 bg-night-950 px-4 py-3 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending || !activeThread}
            className="rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-medium text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
        {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
      </div>
    </div>
  );
}
