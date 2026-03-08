import { ChatSimulator } from "@/components/dashboard/chat-simulator";
import { PageHeader } from "@/components/dashboard/page-header";

type ChatPageProps = {
  searchParams: Promise<{ prompt?: string; thread?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const initialPrompt = params.prompt?.trim().slice(0, 600) || undefined;
  const initialThreadId = params.thread?.trim() || undefined;
  const showStudioIntro = !initialThreadId;

  return (
    <div className="space-y-3">
      {showStudioIntro ? (
        <PageHeader
          eyebrow="Companion"
          title="Reflective Companion"
          description="Think clearly, regulate emotion, and turn philosophy into concrete next actions."
        />
      ) : null}

      <div className="grid gap-3">
        <ChatSimulator initialPrompt={initialPrompt} initialThreadId={initialThreadId} />
      </div>
    </div>
  );
}
