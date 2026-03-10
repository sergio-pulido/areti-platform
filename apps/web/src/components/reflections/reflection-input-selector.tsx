import type { ComponentType } from "react";
import { Mic, PenLine, Upload } from "lucide-react";
import type { ApiReflectionSourceType } from "@/lib/backend-api";

type ReflectionInputSelectorProps = {
  value: ApiReflectionSourceType;
  onChange: (nextValue: ApiReflectionSourceType) => void;
};

const options: Array<{
  value: ApiReflectionSourceType;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  {
    value: "voice",
    title: "Record voice",
    description: "Speak naturally and submit your note.",
    icon: Mic,
  },
  {
    value: "upload",
    title: "Upload audio",
    description: "Use an existing voice memo or recording.",
    icon: Upload,
  },
  {
    value: "text",
    title: "Write text",
    description: "Type or paste your reflection directly.",
    icon: PenLine,
  },
];

export function ReflectionInputSelector({ value, onChange }: ReflectionInputSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border p-4 text-left transition ${
              isActive
                ? "border-sage-300/80 bg-sage-500/14"
                : "border-night-700 bg-night-950/70 hover:border-night-500"
            }`}
          >
            <span
              className={`inline-flex rounded-xl border p-2 ${
                isActive
                  ? "border-sage-300/55 bg-sage-500/18 text-sage-100"
                  : "border-night-700 bg-night-900 text-night-100"
              }`}
            >
              <Icon size={16} />
            </span>
            <p className="mt-3 text-sm font-semibold text-sand-100">{option.title}</p>
            <p className="mt-1 text-xs text-night-300">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}
