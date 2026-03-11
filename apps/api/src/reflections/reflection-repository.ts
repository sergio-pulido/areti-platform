import {
  attachReflectionAudioAsset,
  countReflectionsByUser,
  createChatMessage,
  createChatThread,
  createReflectionEntry,
  createReflectionEvent,
  getLatestReflectionAudioAsset,
  getReflectionById,
  getReflectionByIdForUser,
  listReflectionProcessingJobs,
  listReflectionsByUser,
  setReflectionTags,
  softDeleteReflectionByIdForUser,
  updateReflectionById,
  updateReflectionByIdForUser,
  upsertReflectionProcessingJob,
  type ReflectionEntryRecord,
  type ReflectionEventType,
  type ReflectionListItemRecord,
  type ReflectionProcessingJobRecord,
  type ReflectionProcessingJobStatus,
  type ReflectionProcessingStep,
  type ReflectionSourceType,
  type ReflectionStatus,
} from "@areti/db";

type ReflectionCreateRecordInput = {
  id: string;
  userId: string;
  title: string;
  sourceType: ReflectionSourceType;
  rawText: string;
  commentaryMode?: string | null;
  language?: string;
  status?: ReflectionStatus;
};

export class ReflectionRepository {
  create(input: ReflectionCreateRecordInput): ReflectionEntryRecord {
    return createReflectionEntry(input);
  }

  attachAudio(input: {
    id: string;
    reflectionId: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds?: number | null;
  }): void {
    attachReflectionAudioAsset(input);
  }

  setTags(reflectionId: string, tags: string[]): void {
    setReflectionTags(reflectionId, tags);
  }

  countByUser(input: {
    userId: string;
    search?: string;
    favoriteOnly?: boolean;
    status?: ReflectionStatus;
  }): number {
    return countReflectionsByUser(input);
  }

  listByUser(input: {
    userId: string;
    limit: number;
    offset: number;
    search?: string;
    favoriteOnly?: boolean;
    status?: ReflectionStatus;
  }): ReflectionListItemRecord[] {
    return listReflectionsByUser(input);
  }

  getForUser(userId: string, reflectionId: string): ReflectionEntryRecord | null {
    return getReflectionByIdForUser(userId, reflectionId);
  }

  getById(reflectionId: string): ReflectionEntryRecord | null {
    return getReflectionById(reflectionId);
  }

  getLatestAudioAsset(reflectionId: string) {
    return getLatestReflectionAudioAsset(reflectionId);
  }

  updateById(
    reflectionId: string,
    input: {
      title?: string;
      rawText?: string;
      cleanTranscript?: string | null;
      refinedText?: string | null;
      commentary?: string | null;
      commentaryMode?: string | null;
      language?: string;
      isFavorite?: boolean;
      status?: ReflectionStatus;
      processingError?: string | null;
      deletedAt?: string | null;
    },
  ): ReflectionEntryRecord | null {
    return updateReflectionById(reflectionId, input);
  }

  updateForUser(
    userId: string,
    reflectionId: string,
    input: {
      title?: string;
      refinedText?: string | null;
      commentary?: string | null;
      commentaryMode?: string | null;
      isFavorite?: boolean;
      status?: ReflectionStatus;
    },
  ): ReflectionEntryRecord | null {
    return updateReflectionByIdForUser(userId, reflectionId, input);
  }

  softDeleteForUser(userId: string, reflectionId: string): boolean {
    return softDeleteReflectionByIdForUser(userId, reflectionId);
  }

  upsertProcessingJob(input: {
    reflectionId: string;
    step: ReflectionProcessingStep;
    status: ReflectionProcessingJobStatus;
    errorMessage?: string | null;
  }): ReflectionProcessingJobRecord {
    return upsertReflectionProcessingJob(input);
  }

  listProcessingJobs(reflectionId: string): ReflectionProcessingJobRecord[] {
    return listReflectionProcessingJobs(reflectionId);
  }

  createEvent(input: {
    id: string;
    userId: string;
    reflectionId?: string | null;
    eventType: ReflectionEventType;
    metadataJson?: string;
  }): void {
    createReflectionEvent(input);
  }

  createCompanionThreadFromReflection(input: {
    threadId: string;
    messageId: string;
    userId: string;
    title: string;
    message: string;
  }): { threadId: string } {
    createChatThread({
      id: input.threadId,
      userId: input.userId,
      title: input.title,
    });

    createChatMessage({
      id: input.messageId,
      threadId: input.threadId,
      role: "user",
      content: input.message,
    });

    return { threadId: input.threadId };
  }
}
