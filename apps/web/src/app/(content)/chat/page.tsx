import Link from "next/link";
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
    <div className="flex h-[calc(100dvh-56px-3rem)] min-h-[32rem] flex-col gap-3 overflow-hidden">
      {showStudioIntro ? (
        <PageHeader
          eyebrow="Companion"
          title="Reflective Companion"
          description="Think clearly, regulate emotion, and turn philosophy into concrete next actions."
          actions={
            <Link
              href="/preview/chat"
              className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Open public token preview
            </Link>
          }
        />
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3">
        <ChatSimulator initialPrompt={initialPrompt} initialThreadId={initialThreadId} />
      </div>
    </div>
  );
}
