export const CHAT_THREADS_INVALIDATE_EVENT = "chat:threads:invalidate";

export function emitChatThreadsInvalidated(): void {
  window.dispatchEvent(new CustomEvent(CHAT_THREADS_INVALIDATE_EVENT));
}
