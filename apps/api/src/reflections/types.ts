import type {
  ReflectionEntryRecord,
  ReflectionProcessingJobRecord,
  ReflectionSourceType,
  ReflectionStatus,
} from "@areti/db";

export type ReflectionProvider = "deepseek" | "openai";

export type ReflectionProviderRuntime = {
  provider: ReflectionProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type ReflectionChatConfig = {
  providers: ReflectionProviderRuntime[];
};

export type ReflectionTranscriptionConfig = {
  openAiApiKey: string | null;
  openAiBaseUrl: string;
  model: string;
};

export type ReflectionCreateInput = {
  sourceType: ReflectionSourceType;
  title?: string;
  rawText?: string;
  tags?: string[];
  language?: string;
  commentaryMode?: string | null;
  audio?: {
    fileName: string;
    mimeType: string;
    base64Data: string;
    durationSeconds?: number | null;
  };
};

export type ReflectionUpdateInput = {
  title?: string;
  tags?: string[];
  isFavorite?: boolean;
  refinedText?: string;
};

export type ReflectionListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  favoriteOnly?: boolean;
  status?: ReflectionStatus;
};

export type ReflectionAudioView = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  playbackUrl: string;
};

export type ReflectionDetailView = {
  id: string;
  title: string;
  sourceType: ReflectionSourceType;
  rawText: string;
  cleanTranscript: string | null;
  refinedText: string | null;
  commentary: string | null;
  commentaryMode: string | null;
  language: string;
  isFavorite: boolean;
  status: ReflectionStatus;
  processingError: string | null;
  tags: string[];
  audio: ReflectionAudioView | null;
  processingJobs: ReflectionProcessingJobRecord[];
  createdAt: string;
  updatedAt: string;
};

export type ReflectionListItemView = {
  id: string;
  title: string;
  sourceType: ReflectionSourceType;
  status: ReflectionStatus;
  isFavorite: boolean;
  preview: string;
  commentary: string | null;
  tags: string[];
  hasAudio: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReflectionListResponse = {
  items: ReflectionListItemView[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type ReflectionProcessingResult = {
  reflection: ReflectionEntryRecord;
  processingJobs: ReflectionProcessingJobRecord[];
};
