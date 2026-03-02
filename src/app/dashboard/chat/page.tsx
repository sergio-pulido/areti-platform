import { ChatSimulator } from "@/components/dashboard/chat-simulator";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

export default function ChatPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Chatbot"
        title="Socratic AI Companion"
        description="Ask complex life and work questions and get concise guidance through a mixed-philosophy lens."
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ChatSimulator />

        <SurfaceCard title="Prompt ideas" subtitle="Try these first">
          <ul className="space-y-3 text-sm text-night-200">
            <li className="rounded-2xl border border-night-800 bg-night-950/70 p-3">
              I feel anxious before big meetings. What should I practice this week?
            </li>
            <li className="rounded-2xl border border-night-800 bg-night-950/70 p-3">
              How do I balance ambition with inner peace?
            </li>
            <li className="rounded-2xl border border-night-800 bg-night-950/70 p-3">
              What would a Stoic-Epicurean daily routine look like for me?
            </li>
          </ul>
        </SurfaceCard>
      </div>
    </div>
  );
}
