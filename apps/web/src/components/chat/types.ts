export type ChatContextState = "ok" | "warning" | "degraded";

export type ChatContextTelemetry = {
  summarizedMessageCount: number;
  estimatedPromptTokens: number;
  contextCapacity: number;
  usagePercent: number;
  state: ChatContextState;
  autoSummariesCount: number;
  lastSummarizedAt: string | null;
  updatedAt: string;
  summarizedThisTurn?: boolean;
  notice?: string | null;
};

export type ChatThread = {
  id: string;
  userId: string;
  title: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  context: ChatContextTelemetry;
  branch: {
    id: string;
    threadId: string;
    sourceThreadId: string;
    sourceThreadTitle: string;
    sourceMessageId: string;
    sourceMessagePreview: string;
    createdAt: string;
  } | null;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatThreadScope = "active" | "archived";
