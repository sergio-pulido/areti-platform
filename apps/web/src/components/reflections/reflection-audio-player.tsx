import { Headphones } from "lucide-react";
import { Card } from "@/components/ui/card";

type ReflectionAudioPlayerProps = {
  src: string;
  fileName: string;
  mimeType: string;
};

export function ReflectionAudioPlayer({ src, fileName, mimeType }: ReflectionAudioPlayerProps) {
  return (
    <Card variant="muted" className="rounded-[var(--radius-2xl)] border-night-700/70 p-4">
      <div className="flex items-center gap-2 text-night-200">
        <Headphones size={14} />
        <p className="text-sm font-medium text-sand-100">Original audio</p>
      </div>
      <audio className="mt-3 w-full" controls preload="metadata" src={src} />
      <p className="mt-2 text-xs text-night-300">
        {fileName} · {mimeType}
      </p>
    </Card>
  );
}
