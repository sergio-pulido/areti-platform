"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { ReflectionInputSelector } from "@/components/reflections/reflection-input-selector";
import { VoiceRecorder } from "@/components/reflections/voice-recorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiReflectionDetail, ApiReflectionSourceType } from "@/lib/backend-api";
import { parseClientApiData } from "@/lib/client-api";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const allowedAudioMimeTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
]);

type RecordedAudio = {
  blob: Blob;
  durationSeconds: number;
  fileName: string;
  mimeType: string;
};

function splitTags(tagsValue: string): string[] {
  return tagsValue
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 16);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return bufferToBase64(buffer);
}

export function ReflectionNewFlow() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<ApiReflectionSourceType>("voice");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [rawText, setRawText] = useState("");
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioPreviewUrl = useMemo(() => {
    if (!uploadedAudio) {
      return null;
    }
    return URL.createObjectURL(uploadedAudio);
  }, [uploadedAudio]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  async function handleSubmit(): Promise<void> {
    setError(null);

    if (sourceType === "text" && rawText.trim().length === 0) {
      setError("Please write a reflection before submitting.");
      return;
    }

    if (sourceType === "upload" && !uploadedAudio) {
      setError("Please select an audio file to upload.");
      return;
    }

    if (sourceType === "voice" && !recordedAudio) {
      setError("Please record your voice note before submitting.");
      return;
    }

    setPending(true);

    try {
      let audioPayload:
        | {
            fileName: string;
            mimeType: string;
            base64Data: string;
            durationSeconds?: number;
          }
        | undefined;

      if (sourceType === "upload" && uploadedAudio) {
        if (!allowedAudioMimeTypes.has(uploadedAudio.type)) {
          throw new Error("Unsupported audio format. Please upload MP3, M4A, WAV, OGG, or WEBM.");
        }

        if (uploadedAudio.size > MAX_AUDIO_BYTES) {
          throw new Error("Audio file is too large. Keep it under 10 MB.");
        }

        audioPayload = {
          fileName: uploadedAudio.name,
          mimeType: uploadedAudio.type,
          base64Data: await fileToBase64(uploadedAudio),
        };
      }

      if (sourceType === "voice" && recordedAudio) {
        const file = new File([recordedAudio.blob], recordedAudio.fileName, {
          type: recordedAudio.mimeType,
        });

        if (file.size > MAX_AUDIO_BYTES) {
          throw new Error("Recording is too large. Keep it under 10 MB.");
        }

        audioPayload = {
          fileName: file.name,
          mimeType: file.type,
          base64Data: await fileToBase64(file),
          durationSeconds: recordedAudio.durationSeconds,
        };
      }

      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType,
          title: title.trim() || undefined,
          rawText: sourceType === "text" ? rawText.trim() : undefined,
          tags: splitTags(tags),
          audio: audioPayload,
        }),
      });

      const created = await parseClientApiData<ApiReflectionDetail>(response);
      router.push(`/reflections/${created.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create reflection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-5">
      <ReflectionInputSelector
        value={sourceType}
        onChange={(nextValue) => {
          setSourceType(nextValue);
          setError(null);
        }}
      />

      <div className="rounded-3xl border border-night-700 bg-night-900/70 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="reflection-title" className="text-xs uppercase tracking-[0.16em] text-night-300">
              Title
            </label>
            <Input
              id="reflection-title"
              maxLength={90}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="reflection-tags" className="text-xs uppercase tracking-[0.16em] text-night-300">
              Tags
            </label>
            <Input
              id="reflection-tags"
              maxLength={240}
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="work, decision, clarity"
            />
          </div>
        </div>

        <div className="mt-4">
          {sourceType === "text" ? (
            <div className="space-y-2">
              <label htmlFor="reflection-body" className="text-sm text-sand-100">
                Reflection
              </label>
              <Textarea
                id="reflection-body"
                rows={9}
                maxLength={15000}
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Say it as it is. You can be messy here."
              />
            </div>
          ) : null}

          {sourceType === "upload" ? (
            <div className="rounded-2xl border border-night-700 bg-night-950/60 p-4">
              <label
                htmlFor="reflection-upload"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-night-600 px-4 py-8 text-center hover:border-night-500"
              >
                <UploadCloud size={20} className="text-night-200" />
                <p className="mt-2 text-sm font-medium text-sand-100">Choose an audio file</p>
                <p className="mt-1 text-xs text-night-300">MP3, M4A, WAV, OGG, or WEBM. Max 10 MB.</p>
              </label>
              <input
                id="reflection-upload"
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setUploadedAudio(file);
                  setError(null);
                }}
              />

              {uploadedAudio ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-night-200">
                    {uploadedAudio.name} · {(uploadedAudio.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {audioPreviewUrl ? <audio controls src={audioPreviewUrl} className="w-full" /> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {sourceType === "voice" ? (
            <VoiceRecorder
              onReady={(result) => {
                setRecordedAudio(result);
                setError(null);
              }}
              onClear={() => setRecordedAudio(null)}
            />
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button onClick={() => void handleSubmit()} disabled={pending}>
            {pending ? <Loader2 size={15} className="animate-spin" /> : null}
            {pending ? "Creating reflection..." : "Create reflection"}
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setTitle("");
              setTags("");
              setRawText("");
              setUploadedAudio(null);
              setRecordedAudio(null);
              setError(null);
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </section>
  );
}
