"use client";

import { useSearchParams } from "next/navigation";
import { InteractiveCardLink } from "@/components/dashboard/interactive-card-link";
import { SurfaceCard } from "@/components/dashboard/surface-card";

type ChatStartersPanelProps = {
  prompts: string[];
};

export function ChatStartersPanel({ prompts }: ChatStartersPanelProps) {
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get("thread");

  if (activeThreadId) {
    return null;
  }

  return (
    <SurfaceCard title="Conversation starters" subtitle="Try one prompt to begin">
      <ul className="space-y-3 text-sm text-night-200">
        {prompts.map((prompt) => (
          <li key={prompt}>
            <InteractiveCardLink
              href={`/chat?prompt=${encodeURIComponent(prompt)}`}
              ariaLabel={`Use prompt idea: ${prompt}`}
            >
              {prompt}
            </InteractiveCardLink>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}
