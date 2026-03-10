import type { ApiReflectionDetail } from "@/lib/backend-api";

type ReflectionProcessingStateProps = {
  reflection: ApiReflectionDetail;
};

const processingSteps: Array<{
  key: "transcription" | "cleaning" | "refinement" | "commentary";
  label: string;
}> = [
  { key: "transcription", label: "Transcribing your reflection" },
  { key: "cleaning", label: "Cleaning the text" },
  { key: "refinement", label: "Refining the writing" },
  { key: "commentary", label: "Preparing a short commentary" },
];

export function ReflectionProcessingState({ reflection }: ReflectionProcessingStateProps) {
  const byStep = new Map(reflection.processingJobs.map((job) => [job.step, job]));

  return (
    <div className="rounded-2xl border border-night-700 bg-night-950/65 p-4">
      <p className="text-sm font-semibold text-sand-100">Processing reflection</p>
      <p className="mt-1 text-xs text-night-300">
        This usually takes a few moments. You can keep this page open while it completes.
      </p>

      <ol className="mt-4 space-y-2">
        {processingSteps.map((step) => {
          const job = byStep.get(step.key);
          const isFailed = job?.status === "failed";
          const isDone = job?.status === "success";
          const isRunning = job?.status === "running";

          return (
            <li
              key={step.key}
              className={`rounded-xl border px-3 py-2 text-sm ${
                isFailed
                  ? "border-rose-300/40 bg-rose-500/10 text-rose-100"
                  : isDone
                    ? "border-sage-300/35 bg-sage-500/10 text-sage-100"
                    : isRunning
                      ? "border-night-600 bg-night-900/80 text-sand-100"
                      : "border-night-700 bg-night-900/60 text-night-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{step.label}</span>
                <span className="text-xs uppercase tracking-[0.16em]">
                  {isFailed ? "Failed" : isDone ? "Done" : isRunning ? "Working" : "Pending"}
                </span>
              </div>
              {isFailed && job?.errorMessage ? (
                <p className="mt-1 text-xs text-rose-100">{job.errorMessage}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
