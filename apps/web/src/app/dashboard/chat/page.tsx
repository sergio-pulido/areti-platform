import { ChatSimulator } from "@/components/dashboard/chat-simulator";
import { InteractiveCardLink } from "@/components/dashboard/interactive-card-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const promptIdeas = [
  "I feel anxious before big meetings. What should I practice this week?",
  "How do I balance ambition with inner peace?",
  "What would a Stoic-Epicurean daily routine look like for me?",
];

type ChatPageProps = {
  searchParams: Promise<{ prompt?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const initialPrompt = params.prompt?.trim().slice(0, 600) || undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Chatbot"
        title="Socratic AI Companion"
        description="Ask complex life and work questions and get concise guidance through a mixed-philosophy lens."
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ChatSimulator initialPrompt={initialPrompt} />

        <SurfaceCard title="Prompt ideas" subtitle="Try these first">
          <ul className="space-y-3 text-sm text-night-200">
            {promptIdeas.map((prompt) => (
              <li key={prompt}>
                <InteractiveCardLink
                  href={`/dashboard/chat?prompt=${encodeURIComponent(prompt)}`}
                  ariaLabel={`Use prompt idea: ${prompt}`}
                >
                  {prompt}
                </InteractiveCardLink>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </div>
    </div>
  );
}
