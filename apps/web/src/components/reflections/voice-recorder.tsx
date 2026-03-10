"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type VoiceRecorderProps = {
  onReady: (result: { blob: Blob; durationSeconds: number; fileName: string; mimeType: string }) => void;
  onClear?: () => void;
};

type RecorderState = "idle" | "recording" | "paused" | "review";

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"];

  for (const candidate of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "audio/webm";
}

export function VoiceRecorder({ onReady, onClear }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const timerSecondsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  function startTimer(): void {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = window.setInterval(() => {
      if (startedAtRef.current === null) {
        return;
      }
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const next = Math.max(0, elapsed);
      timerSecondsRef.current = next;
      setTimerSeconds(next);
    }, 250);
  }

  function stopTimer(): void {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  async function startRecording(): Promise<void> {
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      timerSecondsRef.current = 0;
      setTimerSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });

        if (blob.size === 0) {
          setError("No audio was captured. Please try again.");
          setState("idle");
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(nextUrl);

        const durationSeconds = Math.max(1, timerSecondsRef.current);
        onReady({
          blob,
          durationSeconds,
          fileName: `reflection-${Date.now()}.webm`,
          mimeType: blob.type || mimeType,
        });

        setState("review");
      };

      recorder.start(200);
      setState("recording");
      startTimer();
    } catch {
      setError("Microphone permission was denied. Please allow access and try again.");
      setState("idle");
    }
  }

  function pauseRecording(): void {
    if (!recorderRef.current || recorderRef.current.state !== "recording") {
      return;
    }

    recorderRef.current.pause();
    setState("paused");
    stopTimer();
  }

  function resumeRecording(): void {
    if (!recorderRef.current || recorderRef.current.state !== "paused") {
      return;
    }

    const elapsedMs = timerSeconds * 1000;
    startedAtRef.current = Date.now() - elapsedMs;
    recorderRef.current.resume();
    setState("recording");
    startTimer();
  }

  function stopRecording(): void {
    const recorder = recorderRef.current;
    if (!recorder || (recorder.state !== "recording" && recorder.state !== "paused")) {
      return;
    }

    recorder.stop();
  }

  function discardRecording(): void {
    stopTimer();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    setTimerSeconds(0);
    timerSecondsRef.current = 0;
    setState("idle");
    setError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    onClear?.();
  }

  return (
    <div className="rounded-2xl border border-night-700 bg-night-950/60 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sand-100">Voice recorder</p>
          <p className="text-xs text-night-300">Speak freely. You can review before submitting.</p>
        </div>
        <p className="rounded-lg border border-night-700 bg-night-900/85 px-2.5 py-1 text-xs text-sand-100">
          {formatDuration(timerSeconds)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {state === "idle" ? (
          <Button onClick={() => void startRecording()}>
            <Mic size={15} />
            Start recording
          </Button>
        ) : null}

        {state === "recording" ? (
          <>
            <Button variant="secondary" onClick={pauseRecording}>
              <Pause size={15} />
              Pause
            </Button>
            <Button variant="destructive" onClick={stopRecording}>
              <Square size={15} />
              Stop
            </Button>
          </>
        ) : null}

        {state === "paused" ? (
          <>
            <Button variant="secondary" onClick={resumeRecording}>
              <Play size={15} />
              Resume
            </Button>
            <Button variant="destructive" onClick={stopRecording}>
              <Square size={15} />
              Stop
            </Button>
          </>
        ) : null}

        {state === "review" ? (
          <Button variant="ghost" onClick={discardRecording}>
            <Trash2 size={15} />
            Discard
          </Button>
        ) : null}
      </div>

      {previewUrl ? (
        <audio className="mt-4 w-full" controls src={previewUrl} preload="metadata" />
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
