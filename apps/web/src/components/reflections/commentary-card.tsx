import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

type CommentaryCardProps = {
  commentary: string | null;
};

export function CommentaryCard({ commentary }: CommentaryCardProps) {
  return (
    <Card
      variant="default"
      className="rounded-[var(--radius-2xl)] border-sage-300/20 bg-[linear-gradient(140deg,rgba(106,138,99,0.14),rgba(32,26,22,0.86))]"
    >
      <div className="flex items-center gap-2 text-sage-100">
        <Sparkles size={15} />
        <p className="text-xs uppercase tracking-[0.2em]">Commentary</p>
      </div>
      <p className="mt-3 text-sm text-night-100">
        {commentary?.trim() || "Commentary will appear after processing finishes."}
      </p>
    </Card>
  );
}
