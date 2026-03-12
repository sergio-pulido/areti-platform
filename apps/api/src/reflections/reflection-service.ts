import { randomUUID } from "node:crypto";
import type { ReflectionEntryRecord } from "@areti/db";
import { ReflectionAiService } from "./reflection-ai-service.js";
import { ReflectionProcessingService } from "./reflection-processing-service.js";
import { ReflectionRepository } from "./reflection-repository.js";
import { ReflectionStorageService } from "./reflection-storage-service.js";
import type {
  ReflectionCreateInput,
  ReflectionDetailView,
  ReflectionListQuery,
  ReflectionListResponse,
  ReflectionUpdateInput,
} from "./types.js";

function buildTitleFromText(rawText: string, fallback: string): string {
  const normalized = rawText
    .replace(/\s+/g, " ")
    .trim()
    .replace(/["'`]/g, "");

  if (!normalized) {
    return fallback;
  }

  const words = normalized.split(" ").slice(0, 8).join(" ").trim();
  if (!words) {
    return fallback;
  }

  const titled = words.charAt(0).toUpperCase() + words.slice(1);
  return titled.length > 90 ? `${titled.slice(0, 87).trimEnd()}...` : titled;
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, " "))
        .filter((tag) => tag.length > 0),
    ),
  ).slice(0, 16);
}

function nowDateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export class ReflectionService {
  constructor(
    private readonly repository: ReflectionRepository,
    private readonly aiService: ReflectionAiService,
    private readonly storageService: ReflectionStorageService,
    private readonly processingService: ReflectionProcessingService,
  ) {}

  private toDetailView(entry: ReflectionEntryRecord): ReflectionDetailView {
    const latestAudio = entry.audioAssets.at(-1) ?? null;

    return {
      id: entry.id,
      title: entry.title,
      sourceType: entry.sourceType,
      rawText: entry.rawText,
      cleanTranscript: entry.cleanTranscript,
      refinedText: entry.refinedText,
      commentary: entry.commentary,
      commentaryMode: entry.commentaryMode,
      language: entry.language,
      isFavorite: entry.isFavorite,
      status: entry.status,
      processingError: entry.processingError,
      tags: entry.tags.map((tag) => tag.tag),
      audio: latestAudio
        ? {
            fileName: latestAudio.fileName,
            mimeType: latestAudio.mimeType,
            sizeBytes: latestAudio.sizeBytes,
            durationSeconds: latestAudio.durationSeconds,
            playbackUrl: `/api/v1/reflections/${entry.id}/audio`,
          }
        : null,
      processingJobs: entry.processingJobs,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  async createReflection(userId: string, input: ReflectionCreateInput): Promise<ReflectionDetailView> {
    const sourceType = input.sourceType;
    const language = input.language?.trim() || "en";
    const normalizedTags = normalizeTags(input.tags);

    if (sourceType === "text") {
      const rawText = input.rawText?.trim() ?? "";
      if (!rawText) {
        throw new Error("Reflection text is required.");
      }

      const title =
        input.title?.trim() ||
        buildTitleFromText(rawText, `Reflection · ${nowDateLabel()}`);

      const created = this.repository.create({
        id: randomUUID(),
        userId,
        title,
        sourceType,
        rawText,
        language,
        commentaryMode: input.commentaryMode ?? null,
        status: "processing",
      });

      if (normalizedTags.length > 0) {
        this.repository.setTags(created.id, normalizedTags);
      }

      this.repository.createEvent({
        id: randomUUID(),
        userId,
        reflectionId: created.id,
        eventType: "reflection_created",
        metadataJson: JSON.stringify({ sourceType }),
      });

      this.processingService.enqueue(created.id);
      const entry = this.repository.getForUser(userId, created.id);

      if (!entry) {
        throw new Error("Unable to load the created reflection.");
      }

      return this.toDetailView(entry);
    }

    const audio = input.audio;
    if (!audio) {
      throw new Error("Audio payload is required for voice/upload reflections.");
    }

    const title =
      input.title?.trim() ||
      `${sourceType === "upload" ? "Audio upload" : "Voice reflection"} · ${nowDateLabel()}`;
    const parsedBase64 = this.aiService.parseAndNormalizeBase64Audio(audio.base64Data);
    const persistedAudio = await this.storageService.persistAudio({
      base64Data: parsedBase64,
      fileName: audio.fileName,
      mimeType: audio.mimeType,
      durationSeconds: audio.durationSeconds,
    });

    const created = this.repository.create({
      id: randomUUID(),
      userId,
      title,
      sourceType,
      rawText: "",
      language,
      commentaryMode: input.commentaryMode ?? null,
      status: "processing",
    });

    this.repository.attachAudio({
      id: randomUUID(),
      reflectionId: created.id,
      storageKey: persistedAudio.storageKey,
      fileName: persistedAudio.fileName,
      mimeType: persistedAudio.mimeType,
      sizeBytes: persistedAudio.sizeBytes,
      durationSeconds: persistedAudio.durationSeconds,
    });

    if (normalizedTags.length > 0) {
      this.repository.setTags(created.id, normalizedTags);
    }

    this.repository.createEvent({
      id: randomUUID(),
      userId,
      reflectionId: created.id,
      eventType: "reflection_created",
      metadataJson: JSON.stringify({
        sourceType,
        audioBytes: persistedAudio.sizeBytes,
      }),
    });

    this.processingService.enqueue(created.id);
    const entry = this.repository.getForUser(userId, created.id);

    if (!entry) {
      throw new Error("Unable to load the created reflection.");
    }

    return this.toDetailView(entry);
  }

  listReflections(userId: string, query: ReflectionListQuery): ReflectionListResponse {
    const page = Math.max(1, query.page);
    const pageSize = Math.max(1, Math.min(30, query.pageSize));
    const totalItems = this.repository.countByUser({
      userId,
      search: query.search,
      favoriteOnly: query.favoriteOnly,
      status: query.status,
    });

    const items = this.repository.listByUser({
      userId,
      search: query.search,
      favoriteOnly: query.favoriteOnly,
      status: query.status,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        sourceType: item.sourceType,
        status: item.status,
        isFavorite: item.isFavorite,
        preview: item.preview,
        commentary: item.commentary,
        tags: item.tags,
        hasAudio: item.hasAudio,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    };
  }

  getReflection(userId: string, reflectionId: string): ReflectionDetailView | null {
    const entry = this.repository.getForUser(userId, reflectionId);
    if (!entry) {
      return null;
    }

    return this.toDetailView(entry);
  }

  updateReflection(
    userId: string,
    reflectionId: string,
    input: ReflectionUpdateInput,
  ): ReflectionDetailView | null {
    const existing = this.repository.getForUser(userId, reflectionId);

    if (!existing) {
      return null;
    }

    const updated = this.repository.updateForUser(userId, reflectionId, {
      title: input.title?.trim() || undefined,
      refinedText: input.refinedText === undefined ? undefined : input.refinedText.trim(),
      isFavorite: input.isFavorite,
    });

    if (!updated) {
      return null;
    }

    if (input.tags) {
      this.repository.setTags(reflectionId, normalizeTags(input.tags));
    }

    if (input.isFavorite !== undefined && input.isFavorite !== existing.isFavorite) {
      this.repository.createEvent({
        id: randomUUID(),
        userId,
        reflectionId,
        eventType: "reflection_favorited",
        metadataJson: JSON.stringify({
          isFavorite: input.isFavorite,
        }),
      });
    }

    const reloaded = this.repository.getForUser(userId, reflectionId);
    return reloaded ? this.toDetailView(reloaded) : this.toDetailView(updated);
  }

  deleteReflection(userId: string, reflectionId: string): boolean {
    return this.repository.softDeleteForUser(userId, reflectionId);
  }

  regenerateCommentary(userId: string, reflectionId: string): Promise<ReflectionDetailView | null> {
    const existing = this.repository.getForUser(userId, reflectionId);

    if (!existing) {
      return Promise.resolve(null);
    }

    return this.processingService.regenerateCommentary(reflectionId).then(() => {
      const reloaded = this.repository.getForUser(userId, reflectionId);
      return reloaded ? this.toDetailView(reloaded) : null;
    });
  }

  retryProcessing(userId: string, reflectionId: string): ReflectionDetailView | null {
    const existing = this.repository.getForUser(userId, reflectionId);

    if (!existing) {
      return null;
    }

    this.repository.updateById(reflectionId, {
      status: "processing",
      processingError: null,
    });

    this.processingService.enqueue(reflectionId);

    const reloaded = this.repository.getForUser(userId, reflectionId);
    return reloaded ? this.toDetailView(reloaded) : null;
  }

  sendToCompanion(
    userId: string,
    reflectionId: string,
  ): { threadId: string; href: string } | null {
    const reflection = this.repository.getForUser(userId, reflectionId);

    if (!reflection) {
      return null;
    }

    const mainBody =
      reflection.refinedText?.trim() || reflection.cleanTranscript?.trim() || reflection.rawText.trim();

    if (!mainBody) {
      throw new Error("This reflection has no text to send to Companion yet.");
    }

    const title = reflection.title.trim().slice(0, 80) || "Reflection handoff";
    const threadTitle = `Reflection: ${title}`.slice(0, 120);
    const message = [
      "I want to explore this reflection more deeply.",
      "",
      `Reflection title: ${reflection.title}`,
      "",
      "Refined text:",
      mainBody,
      reflection.commentary?.trim()
        ? `\nCommentary:\n${reflection.commentary.trim()}`
        : "",
      "",
      "Please help me examine the tension, assumptions, and one concrete next step.",
    ]
      .filter((section) => section.length > 0)
      .join("\n");

    const threadId = randomUUID();

    this.repository.createCompanionThreadFromReflection({
      threadId,
      messageId: randomUUID(),
      userId,
      title: threadTitle,
      message,
    });

    this.repository.createEvent({
      id: randomUUID(),
      userId,
      reflectionId,
      eventType: "reflection_sent_to_companion",
      metadataJson: JSON.stringify({ threadId }),
    });

    return {
      threadId,
      href: `/chat?thread=${encodeURIComponent(threadId)}`,
    };
  }

  resolveAudioForPlayback(
    userId: string,
    reflectionId: string,
  ): { filePath: string; mimeType: string; fileName: string } | null {
    const reflection = this.repository.getForUser(userId, reflectionId);

    if (!reflection) {
      return null;
    }

    const latestAudio = reflection.audioAssets.at(-1);

    if (!latestAudio) {
      return null;
    }

    return {
      filePath: this.storageService.resolveStoragePath(latestAudio.storageKey),
      mimeType: latestAudio.mimeType,
      fileName: latestAudio.fileName,
    };
  }
}
