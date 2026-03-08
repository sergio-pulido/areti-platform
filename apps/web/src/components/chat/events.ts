export const CHAT_THREADS_INVALIDATE_EVENT = "chat:threads:invalidate";
export const CHAT_THREAD_PREVIEW_EVENT = "chat:thread:preview";

export type ChatThreadPreviewDetail = {
  threadId: string;
  preview: string;
};

export function emitChatThreadsInvalidated(): void {
  window.dispatchEvent(new CustomEvent(CHAT_THREADS_INVALIDATE_EVENT));
}

export function emitChatThreadPreview(detail: ChatThreadPreviewDetail): void {
  window.dispatchEvent(new CustomEvent(CHAT_THREAD_PREVIEW_EVENT, { detail }));
}
