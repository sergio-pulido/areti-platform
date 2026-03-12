import { describe, expect, it, vi } from "vitest";
import type { ReflectionEntryRecord } from "@areti/db";
import { ReflectionProcessingService } from "./reflection-processing-service.js";
import type { ReflectionAiService } from "./reflection-ai-service.js";
import type { ReflectionRepository } from "./reflection-repository.js";
import type { ReflectionStorageService } from "./reflection-storage-service.js";

function buildReflection(overrides?: Partial<ReflectionEntryRecord>): ReflectionEntryRecord {
  return {
    id: "reflection-1",
    userId: "user-1",
    title: "Test reflection",
    sourceType: "text",
    rawText: "I want clarity but keep delaying decisions.",
    cleanTranscript: null,
    refinedText: null,
    commentary: null,
    commentaryMode: null,
    language: "en",
    isFavorite: false,
    status: "processing",
    processingError: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    tags: [],
    audioAssets: [],
    processingJobs: [],
    ...overrides,
  };
}

describe("ReflectionProcessingService", () => {
  it("processes a text reflection end-to-end", async () => {
    const updates: Array<Record<string, unknown>> = [];
    const jobs: Array<Record<string, unknown>> = [];
    const events: Array<Record<string, unknown>> = [];

    const repository = {
      getById: vi.fn(() => buildReflection()),
      updateById: vi.fn((_id: string, input: Record<string, unknown>) => {
        updates.push(input);
        return buildReflection({
          cleanTranscript: (input.cleanTranscript as string | undefined) ?? "clean",
          refinedText: (input.refinedText as string | undefined) ?? "refined",
          commentary: (input.commentary as string | undefined) ?? "commentary",
          status: (input.status as ReflectionEntryRecord["status"] | undefined) ?? "ready",
        });
      }),
      createEvent: vi.fn((input: Record<string, unknown>) => {
        events.push(input);
      }),
      upsertProcessingJob: vi.fn((input: Record<string, unknown>) => {
        jobs.push(input);
        return input;
      }),
      getLatestAudioAsset: vi.fn(() => null),
    } as unknown as ReflectionRepository;

    const aiService = {
      generateCleanTranscript: vi.fn(async () => "I want clarity, but I delay decisions."),
      generateRefinedReflection: vi.fn(
        async () => "I keep delaying decisions even though I want clarity. I need to define one next step.",
      ),
      generateCommentary: vi.fn(
        async () => "You already named the pattern clearly. The next question is what single decision would break it today.",
      ),
      transcribeAudio: vi.fn(),
    } as unknown as ReflectionAiService;

    const storageService = {
      resolveStoragePath: vi.fn((key: string) => key),
    } as unknown as ReflectionStorageService;

    const service = new ReflectionProcessingService(repository, aiService, storageService);

    const result = await service.processReflection("reflection-1");

    expect(result?.status).toBe("ready");
    expect(aiService.generateCleanTranscript).toHaveBeenCalledTimes(1);
    expect(aiService.generateRefinedReflection).toHaveBeenCalledTimes(1);
    expect(aiService.generateCommentary).toHaveBeenCalledTimes(1);

    const runningSteps = jobs
      .filter((job) => job.status === "running")
      .map((job) => job.step);
    expect(runningSteps).toEqual(["cleaning", "refinement", "commentary"]);

    expect(events.some((event) => event.eventType === "reflection_processing_started")).toBe(true);
    expect(events.some((event) => event.eventType === "reflection_processing_completed")).toBe(true);

    expect(
      updates.some((update) => update.status === "ready" && update.processingError === null),
    ).toBe(true);
  });

  it("records a failed transcription step when audio asset is missing", async () => {
    const jobs: Array<Record<string, unknown>> = [];

    const repository = {
      getById: vi.fn(() => buildReflection({ sourceType: "upload", rawText: "" })),
      updateById: vi.fn((_id: string, input: Record<string, unknown>) =>
        buildReflection({
          sourceType: "upload",
          status: (input.status as ReflectionEntryRecord["status"] | undefined) ?? "failed",
          processingError: (input.processingError as string | null | undefined) ?? null,
        }),
      ),
      createEvent: vi.fn(),
      upsertProcessingJob: vi.fn((input: Record<string, unknown>) => {
        jobs.push(input);
        return input;
      }),
      getLatestAudioAsset: vi.fn(() => null),
    } as unknown as ReflectionRepository;

    const aiService = {
      generateCleanTranscript: vi.fn(),
      generateRefinedReflection: vi.fn(),
      generateCommentary: vi.fn(),
      transcribeAudio: vi.fn(),
    } as unknown as ReflectionAiService;

    const storageService = {
      resolveStoragePath: vi.fn((key: string) => key),
    } as unknown as ReflectionStorageService;

    const service = new ReflectionProcessingService(repository, aiService, storageService);

    const result = await service.processReflection("reflection-1");

    expect(result?.status).toBe("failed");
    expect(jobs.some((job) => job.step === "transcription" && job.status === "failed")).toBe(true);
    expect(aiService.generateCleanTranscript).not.toHaveBeenCalled();
  });
});
