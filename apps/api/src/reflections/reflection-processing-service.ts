import { randomUUID } from "node:crypto";
import type { ReflectionEntryRecord, ReflectionProcessingStep } from "@ataraxia/db";
import type { ReflectionAiService } from "./reflection-ai-service.js";
import type { ReflectionRepository } from "./reflection-repository.js";
import type { ReflectionStorageService } from "./reflection-storage-service.js";

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return "Unknown reflection processing error";
}

export class ReflectionProcessingService {
  private readonly activeProcessing = new Set<string>();

  constructor(
    private readonly repository: ReflectionRepository,
    private readonly aiService: ReflectionAiService,
    private readonly storageService: ReflectionStorageService,
  ) {}

  enqueue(reflectionId: string): void {
    if (this.activeProcessing.has(reflectionId)) {
      return;
    }

    this.activeProcessing.add(reflectionId);

    queueMicrotask(() => {
      void this.processReflection(reflectionId)
        .catch((error) => {
          console.warn(`[reflections] Unexpected background processing failure: ${normalizeErrorMessage(error)}`);
        })
        .finally(() => {
          this.activeProcessing.delete(reflectionId);
        });
    });
  }

  async processReflection(reflectionId: string): Promise<ReflectionEntryRecord | null> {
    const reflection = this.repository.getById(reflectionId);

    if (!reflection) {
      return null;
    }

    let currentStep: ReflectionProcessingStep | null = null;

    this.repository.updateById(reflectionId, {
      status: "processing",
      processingError: null,
    });

    this.repository.createEvent({
      id: randomUUID(),
      userId: reflection.userId,
      reflectionId,
      eventType: "reflection_processing_started",
      metadataJson: JSON.stringify({
        sourceType: reflection.sourceType,
      }),
    });

    try {
      let workingRawText = reflection.rawText;
      let workingLanguage = reflection.language;

      if (reflection.sourceType !== "text") {
        currentStep = "transcription";
        this.repository.upsertProcessingJob({
          reflectionId,
          step: currentStep,
          status: "running",
        });

        const latestAudioAsset = this.repository.getLatestAudioAsset(reflectionId);

        if (!latestAudioAsset) {
          throw new Error("Missing reflection audio asset.");
        }

        const filePath = this.storageService.resolveStoragePath(latestAudioAsset.storageKey);
        const transcript = await this.aiService.transcribeAudio({
          filePath,
          fileName: latestAudioAsset.fileName,
          mimeType: latestAudioAsset.mimeType,
          language: reflection.language,
        });

        workingRawText = transcript.text;
        workingLanguage = transcript.language ?? workingLanguage;

        this.repository.updateById(reflectionId, {
          rawText: workingRawText,
          language: workingLanguage,
        });

        this.repository.upsertProcessingJob({
          reflectionId,
          step: currentStep,
          status: "success",
        });
      }

      if (!workingRawText.trim()) {
        throw new Error("No text available for reflection processing.");
      }

      currentStep = "cleaning";
      this.repository.upsertProcessingJob({
        reflectionId,
        step: currentStep,
        status: "running",
      });
      const cleanTranscript = await this.aiService.generateCleanTranscript({
        rawText: workingRawText,
        language: workingLanguage,
      });
      this.repository.updateById(reflectionId, {
        cleanTranscript,
      });
      this.repository.upsertProcessingJob({
        reflectionId,
        step: currentStep,
        status: "success",
      });

      currentStep = "refinement";
      this.repository.upsertProcessingJob({
        reflectionId,
        step: currentStep,
        status: "running",
      });
      const refinedText = await this.aiService.generateRefinedReflection({
        rawText: workingRawText,
        cleanTranscript,
        language: workingLanguage,
      });
      this.repository.updateById(reflectionId, {
        refinedText,
      });
      this.repository.upsertProcessingJob({
        reflectionId,
        step: currentStep,
        status: "success",
      });

      currentStep = "commentary";
      this.repository.upsertProcessingJob({
        reflectionId,
        step: currentStep,
        status: "running",
      });
      const commentary = await this.aiService.generateCommentary({
        rawText: workingRawText,
        cleanTranscript,
        refinedText,
        language: workingLanguage,
      });
      const updated = this.repository.updateById(reflectionId, {
        commentary,
        status: "ready",
        processingError: null,
      });
      this.repository.upsertProcessingJob({
        reflectionId,
        step: currentStep,
        status: "success",
      });

      this.repository.createEvent({
        id: randomUUID(),
        userId: reflection.userId,
        reflectionId,
        eventType: "reflection_processing_completed",
        metadataJson: JSON.stringify({
          sourceType: reflection.sourceType,
        }),
      });

      return updated;
    } catch (error) {
      const message = normalizeErrorMessage(error);

      if (currentStep) {
        this.repository.upsertProcessingJob({
          reflectionId,
          step: currentStep,
          status: "failed",
          errorMessage: message,
        });
      }

      const failed = this.repository.updateById(reflectionId, {
        status: "failed",
        processingError: message,
      });

      this.repository.createEvent({
        id: randomUUID(),
        userId: reflection.userId,
        reflectionId,
        eventType: "reflection_processing_failed",
        metadataJson: JSON.stringify({
          sourceType: reflection.sourceType,
          step: currentStep,
          error: message,
        }),
      });

      return failed;
    }
  }

  async regenerateCommentary(reflectionId: string): Promise<ReflectionEntryRecord | null> {
    const reflection = this.repository.getById(reflectionId);

    if (!reflection) {
      return null;
    }

    const rawText = reflection.rawText.trim();
    const cleanTranscript = reflection.cleanTranscript?.trim() || rawText;
    const refinedText = reflection.refinedText?.trim() || cleanTranscript;

    if (!rawText && !cleanTranscript && !refinedText) {
      throw new Error("Reflection text is empty. Complete processing first.");
    }

    this.repository.upsertProcessingJob({
      reflectionId,
      step: "commentary",
      status: "running",
    });

    try {
      const commentary = await this.aiService.generateCommentary({
        rawText,
        cleanTranscript,
        refinedText,
        language: reflection.language,
      });

      const updated = this.repository.updateById(reflectionId, {
        commentary,
        processingError: null,
        status: reflection.status === "failed" ? "ready" : reflection.status,
      });

      this.repository.upsertProcessingJob({
        reflectionId,
        step: "commentary",
        status: "success",
      });

      this.repository.createEvent({
        id: randomUUID(),
        userId: reflection.userId,
        reflectionId,
        eventType: "reflection_commentary_regenerated",
        metadataJson: JSON.stringify({
          fromStatus: reflection.status,
        }),
      });

      return updated;
    } catch (error) {
      const message = normalizeErrorMessage(error);

      this.repository.upsertProcessingJob({
        reflectionId,
        step: "commentary",
        status: "failed",
        errorMessage: message,
      });

      throw error;
    }
  }
}
