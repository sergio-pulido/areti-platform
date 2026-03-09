"use client";

const PREVIEW_SESSION_STORAGE_KEY = "areti_preview_session_id";
const PREVIEW_STARTED_AT_KEY = "areti_preview_started_at";

type PreviewEventType =
  | "preview_page_view"
  | "preview_signup_click"
  | "preview_signup_view"
  | "preview_chat_prompt_submitted"
  | "preview_chat_response_received";

type PreviewEventPayload = {
  eventType: PreviewEventType;
  path: string;
  metadata?: Record<string, string>;
};

function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getPreviewSessionId(): string {
  if (typeof window === "undefined") {
    return "server-preview-session";
  }

  const existing = window.localStorage.getItem(PREVIEW_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = createSessionId();
  window.localStorage.setItem(PREVIEW_SESSION_STORAGE_KEY, created);
  return created;
}

function getPreviewStartedAt(): number {
  if (typeof window === "undefined") {
    return Date.now();
  }

  const raw = window.localStorage.getItem(PREVIEW_STARTED_AT_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const now = Date.now();
  window.localStorage.setItem(PREVIEW_STARTED_AT_KEY, now.toString());
  return now;
}

export function getPreviewInteractionMs(): number {
  return Math.max(800, Date.now() - getPreviewStartedAt());
}

export function trackPreviewEvent(input: PreviewEventPayload): void {
  if (typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify({
    sessionId: getPreviewSessionId(),
    eventType: input.eventType,
    path: input.path,
    referrer: document.referrer || undefined,
    metadata: input.metadata,
    honeypot: "",
    interactionMs: getPreviewInteractionMs(),
  });

  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/preview/events", blob);
    return;
  }

  void fetch("/api/preview/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}
