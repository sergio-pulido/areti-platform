import { ChatStartersPanel } from "@/components/chat/chat-starters-panel";
import { ChatSimulator } from "@/components/dashboard/chat-simulator";
import { PageHeader } from "@/components/dashboard/page-header";

const promptIdeas = [
  "I feel anxious before big meetings. What should I practice this week?",
  "How do I balance ambition with inner peace?",
  "What would a Stoic-Epicurean daily routine look like for me?",
];

type ChatPageProps = {
  searchParams: Promise<{ prompt?: string; thread?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const initialPrompt = params.prompt?.trim().slice(0, 600) || undefined;
  const initialThreadId = params.thread?.trim() || undefined;
  const showStudioIntro = !initialThreadId;

  return (
    <div className="space-y-4">
      {showStudioIntro ? (
        <PageHeader
          eyebrow="Companion"
          title="Socratic Conversation Studio"
          description="Navigate focused threads, think through decisions, and turn philosophy into concrete next actions."
        />
      ) : null}

      <div className={showStudioIntro ? "grid gap-4 2xl:grid-cols-[1.3fr_0.7fr]" : "grid gap-4"}>
        <ChatSimulator initialPrompt={initialPrompt} initialThreadId={initialThreadId} />
        {showStudioIntro ? <ChatStartersPanel prompts={promptIdeas} /> : null}
      </div>
    </div>
  );
}
