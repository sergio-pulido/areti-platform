"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw, Send, Star } from "lucide-react";
import { CommentaryCard } from "@/components/reflections/commentary-card";
import { ReflectionActionsMenu } from "@/components/reflections/reflection-actions-menu";
import { ReflectionAudioPlayer } from "@/components/reflections/reflection-audio-player";
import { ReflectionProcessingState } from "@/components/reflections/reflection-processing-state";
import { ReflectionStatusBadge } from "@/components/reflections/reflection-status-badge";
import { ReflectionTabs } from "@/components/reflections/reflection-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiReflectionDetail } from "@/lib/backend-api";
import { parseClientApiData } from "@/lib/client-api";

type ReflectionDetailClientProps = {
  initialReflection: ApiReflectionDetail;
};

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
  });
  return parseClientApiData<T>(response);
}

function joinTags(tags: string[]): string {
  return tags.join(", ");
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 16);
}

function canEditReflection(reflection: ApiReflectionDetail): boolean {
  return reflection.status === "ready" || reflection.status === "failed";
}

export function ReflectionDetailClient({ initialReflection }: ReflectionDetailClientProps) {
  const router = useRouter();
  const [reflection, setReflection] = useState(initialReflection);
  const [activeTab, setActiveTab] = useState<"clean" | "refined">("refined");
  const [titleDraft, setTitleDraft] = useState(initialReflection.title);
  const [tagsDraft, setTagsDraft] = useState(joinTags(initialReflection.tags));
  const [refinedDraft, setRefinedDraft] = useState(initialReflection.refinedText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busyAction, setBusyAction] = useState<"retry" | "commentary" | "companion" | null>(null);

  useEffect(() => {
    setTitleDraft(reflection.title);
    setTagsDraft(joinTags(reflection.tags));
    setRefinedDraft(reflection.refinedText ?? "");
  }, [reflection.id, reflection.title, reflection.tags, reflection.refinedText]);

  useEffect(() => {
    if (reflection.status !== "processing") {
      return;
    }

    const interval = window.setInterval(() => {
      void requestJson<ApiReflectionDetail>(`/api/reflections/${reflection.id}`)
        .then((next) => {
          setReflection(next);
          if (next.status === "ready") {
            router.refresh();
          }
        })
        .catch(() => undefined);
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [reflection.id, reflection.status, router]);

  const activeText = useMemo(() => {
    if (activeTab === "clean") {
      return reflection.cleanTranscript?.trim() || "Clean transcript will appear after processing.";
    }
    return reflection.refinedText?.trim() || "Refined text will appear after processing.";
  }, [activeTab, reflection.cleanTranscript, reflection.refinedText]);

  async function refreshReflection(): Promise<void> {
    const reloaded = await requestJson<ApiReflectionDetail>(`/api/reflections/${reflection.id}`);
    setReflection(reloaded);
  }

  async function saveEdits(): Promise<void> {
    setError(null);
    setSaving(true);

    try {
      const updated = await requestJson<ApiReflectionDetail>(`/api/reflections/${reflection.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleDraft.trim() || undefined,
          tags: splitTags(tagsDraft),
          refinedText: canEditReflection(reflection) ? refinedDraft.trim() || undefined : undefined,
        }),
      });

      setReflection(updated);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save reflection updates.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite(): Promise<void> {
    setError(null);
    setSaving(true);

    try {
      const updated = await requestJson<ApiReflectionDetail>(`/api/reflections/${reflection.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isFavorite: !reflection.isFavorite,
        }),
      });
      setReflection(updated);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update favorite state.");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateCommentary(): Promise<void> {
    setError(null);
    setBusyAction("commentary");

    try {
      const updated = await requestJson<ApiReflectionDetail>(`/api/reflections/${reflection.id}/commentary`, {
        method: "POST",
      });
      setReflection(updated);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to regenerate commentary.");
    } finally {
      setBusyAction(null);
    }
  }

  async function retryProcessing(): Promise<void> {
    setError(null);
    setBusyAction("retry");

    try {
      const updated = await requestJson<ApiReflectionDetail>(`/api/reflections/${reflection.id}/retry`, {
        method: "POST",
      });
      setReflection(updated);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to retry processing.");
    } finally {
      setBusyAction(null);
    }
  }

  async function sendToCompanion(): Promise<void> {
    setError(null);
    setBusyAction("companion");

    try {
      const payload = await requestJson<{ threadId: string; href: string }>(
        `/api/reflections/${reflection.id}/send-to-companion`,
        {
          method: "POST",
        },
      );

      router.push(payload.href);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send to Companion.");
      setBusyAction(null);
    }
  }

  async function deleteReflection(): Promise<void> {
    const confirmed = window.confirm("Delete this reflection? You can’t undo this action.");
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await requestJson<{ ok: true }>(`/api/reflections/${reflection.id}`, {
        method: "DELETE",
      });
      router.push("/reflections");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to delete reflection.");
      setDeleting(false);
    }
  }

  function copyText(value: string): void {
    void navigator.clipboard.writeText(value).catch(() => {
      setError("Clipboard access was blocked by your browser.");
    });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[var(--radius-2xl)] border border-night-700/75 bg-night-900/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <Input value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} maxLength={90} />
            <div className="flex flex-wrap items-center gap-2 text-xs text-night-300">
              <ReflectionStatusBadge status={reflection.status} />
              <span>{reflection.sourceType}</span>
              <span>{new Date(reflection.createdAt).toLocaleString()}</span>
              {reflection.language ? <span>Language: {reflection.language}</span> : null}
            </div>
            <Input
              value={tagsDraft}
              onChange={(event) => setTagsDraft(event.target.value)}
              placeholder="tags (comma separated)"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={toggleFavorite} disabled={saving}>
              <Star size={15} className={reflection.isFavorite ? "fill-sage-200 text-sage-200" : undefined} />
              {reflection.isFavorite ? "Favorited" : "Favorite"}
            </Button>
            <ReflectionActionsMenu
              onCopyClean={() => copyText(reflection.cleanTranscript ?? reflection.rawText)}
              onCopyRefined={() => copyText(reflection.refinedText ?? reflection.rawText)}
              onDelete={() => void deleteReflection()}
              deleting={deleting}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => void saveEdits()} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? "Saving..." : "Save updates"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void regenerateCommentary()}
            disabled={busyAction !== null || reflection.status === "processing"}
          >
            {busyAction === "commentary" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
            Regenerate commentary
          </Button>
          <Button
            variant="secondary"
            onClick={() => void sendToCompanion()}
            disabled={busyAction !== null || reflection.status === "processing"}
          >
            {busyAction === "companion" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Continue in Companion
          </Button>
          {reflection.status === "failed" ? (
            <Button variant="destructive" onClick={() => void retryProcessing()} disabled={busyAction !== null}>
              {busyAction === "retry" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
              Retry processing
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => void refreshReflection()}>
            Refresh
          </Button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
        {reflection.processingError ? (
          <p className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {reflection.processingError}
          </p>
        ) : null}
      </div>

      {reflection.audio ? (
        <ReflectionAudioPlayer
          src={`/api/reflections/${reflection.id}/audio`}
          fileName={reflection.audio.fileName}
          mimeType={reflection.audio.mimeType}
        />
      ) : null}

      {reflection.status === "processing" ? <ReflectionProcessingState reflection={reflection} /> : null}

      <div className="rounded-[var(--radius-2xl)] border border-night-700/70 bg-night-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ReflectionTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyText(activeTab === "clean" ? reflection.cleanTranscript ?? "" : refinedDraft || "")}
          >
            Copy text
          </Button>
        </div>

        {activeTab === "refined" && canEditReflection(reflection) ? (
          <Textarea
            rows={14}
            value={refinedDraft}
            onChange={(event) => setRefinedDraft(event.target.value)}
            className="mt-4"
          />
        ) : (
          <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-night-700 bg-night-950/70 p-4 text-sm text-night-100">
            {activeText}
          </div>
        )}
      </div>

      <CommentaryCard commentary={reflection.commentary} />
    </section>
  );
}
