import { readFile } from "node:fs/promises";
import {
  buildCleanTranscriptPrompt,
  buildCommentaryPrompt,
  buildRefinedReflectionPrompt,
} from "./prompt-templates.js";
import type { ReflectionChatConfig, ReflectionTranscriptionConfig } from "./types.js";

type ModelMessage = {
  role: "system" | "user";
  content: string;
};

type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

type TranscriptionPayload = {
  text?: string;
  language?: string;
};

type ProviderFailure = {
  provider: string;
  reason: string;
  status: number | null;
};

const REFLECTION_SYSTEM_PROMPT = `
You are Areti Reflection Editor.
Return plain text only.
Do not include markdown, bullet points, or prefacing labels.
Preserve meaning and tone.
Do not provide therapy, diagnosis, or coaching language.
`.trim();

function extractAssistantMessage(payload: ChatCompletionPayload): string | null {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  const text = content
    .filter((part): part is { text: string } => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  return text.length > 0 ? text : null;
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sentenceCase(value: string): string {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return "";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function fallbackCleanTranscript(rawText: string): string {
  const normalized = normalizeWhitespace(rawText)
    .replace(/\b(um+|uh+|like|you know)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  return sentenceCase(normalized);
}

function fallbackRefinedText(cleanTranscript: string, rawText: string): string {
  const source = normalizeWhitespace(cleanTranscript || rawText);
  if (!source) {
    return "";
  }

  const split = source
    .replace(/([.?!])\s+(?=[A-Za-zÀ-ÖØ-öø-ÿ])/g, "$1\n")
    .split("\n")
    .map((line) => sentenceCase(line))
    .filter(Boolean);

  if (split.length <= 1) {
    return split[0] ?? source;
  }

  return split.join(" ");
}

function fallbackCommentary(refinedText: string, rawText: string): string {
  const source = normalizeWhitespace(refinedText || rawText).toLowerCase();

  if (!source) {
    return "There is a useful start here. One clear next step can make it concrete.";
  }

  if (source.includes("should") && (source.includes("want") || source.includes("wish"))) {
    return "You seem split between what you want and what you think you should want. That tension may be the central question to name directly.";
  }

  if (source.includes("again") || source.includes("always") || source.includes("every")) {
    return "You are describing more than one event. It sounds like a repeating pattern worth naming in one short sentence.";
  }

  if (source.includes("not") || source.includes("avoid") || source.includes("stop")) {
    return "There is clarity in what you are moving away from. The next useful step may be defining what you are moving toward.";
  }

  return "Your reflection is clear about the pressure point. A practical next step is to name one decision that would change this pattern today.";
}

function normalizeBase64(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

export class ReflectionAiService {
  constructor(
    private readonly chatConfig: ReflectionChatConfig,
    private readonly transcriptionConfig: ReflectionTranscriptionConfig,
  ) {}

  private async requestChatCompletion(
    messages: ModelMessage[],
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<{ answer: string | null; failures: ProviderFailure[] }> {
    const failures: ProviderFailure[] = [];

    for (const provider of this.chatConfig.providers) {
      try {
        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            model: provider.model,
            messages,
            temperature: options?.temperature ?? 0.3,
            max_tokens: options?.maxTokens,
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          failures.push({
            provider: provider.provider,
            reason: body.slice(0, 300) || "Provider returned non-OK response",
            status: response.status,
          });
          continue;
        }

        const payload = (await response.json()) as ChatCompletionPayload;
        const answer = extractAssistantMessage(payload);
        if (answer) {
          return { answer, failures };
        }

        failures.push({
          provider: provider.provider,
          reason: "Provider returned an empty answer",
          status: response.status,
        });
      } catch (error) {
        failures.push({
          provider: provider.provider,
          reason: error instanceof Error ? error.message : "Unknown request error",
          status: null,
        });
      }
    }

    return { answer: null, failures };
  }

  private async generateText(
    userPrompt: string,
    fallback: () => string,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    if (this.chatConfig.providers.length === 0) {
      return fallback();
    }

    const { answer, failures } = await this.requestChatCompletion(
      [
        { role: "system", content: REFLECTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      options,
    );

    if (answer) {
      return normalizeWhitespace(answer);
    }

    if (failures.length > 0) {
      const summary = failures.map((failure) => `${failure.provider}:${failure.status ?? "ERR"}`).join(",");
      console.warn(`[reflections] All text providers failed. ${summary}`);
    }

    return fallback();
  }

  async generateCleanTranscript(input: {
    rawText: string;
    language?: string;
  }): Promise<string> {
    const prompt = buildCleanTranscriptPrompt({
      rawText: input.rawText,
      language: input.language,
    });

    return this.generateText(prompt, () => fallbackCleanTranscript(input.rawText), {
      maxTokens: 1200,
      temperature: 0.2,
    });
  }

  async generateRefinedReflection(input: {
    rawText: string;
    cleanTranscript: string;
    language?: string;
  }): Promise<string> {
    const prompt = buildRefinedReflectionPrompt({
      rawText: input.rawText,
      cleanTranscript: input.cleanTranscript,
      language: input.language,
    });

    return this.generateText(
      prompt,
      () => fallbackRefinedText(input.cleanTranscript, input.rawText),
      {
        maxTokens: 1400,
        temperature: 0.35,
      },
    );
  }

  async generateCommentary(input: {
    rawText: string;
    cleanTranscript: string;
    refinedText: string;
    language?: string;
  }): Promise<string> {
    const prompt = buildCommentaryPrompt({
      rawText: input.rawText,
      cleanTranscript: input.cleanTranscript,
      refinedText: input.refinedText,
      language: input.language,
    });

    const commentary = await this.generateText(
      prompt,
      () => fallbackCommentary(input.refinedText, input.rawText),
      {
        maxTokens: 220,
        temperature: 0.35,
      },
    );

    const clipped = commentary
      .split(/(?<=[.?!])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(" ");

    return clipped || fallbackCommentary(input.refinedText, input.rawText);
  }

  async transcribeAudio(input: {
    filePath: string;
    fileName: string;
    mimeType: string;
    language?: string;
  }): Promise<{ text: string; language: string | null }> {
    if (!this.transcriptionConfig.openAiApiKey) {
      throw new Error("Audio transcription is unavailable because OPENAI_API_KEY is not configured.");
    }

    const fileBuffer = await readFile(input.filePath);
    const baseUrl = this.transcriptionConfig.openAiBaseUrl.replace(/\/+$/, "");
    const body = new FormData();
    const file = new File([fileBuffer], input.fileName, { type: input.mimeType });

    body.set("file", file);
    body.set("model", this.transcriptionConfig.model);
    if (input.language?.trim()) {
      body.set("language", input.language.trim());
    }

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.transcriptionConfig.openAiApiKey}`,
      },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Transcription failed (${response.status}): ${errorBody.slice(0, 240)}`);
    }

    const payload = (await response.json()) as TranscriptionPayload;
    const text = normalizeWhitespace(payload.text ?? "");

    if (!text) {
      throw new Error("Transcription provider returned empty text.");
    }

    return {
      text,
      language: payload.language?.trim() || null,
    };
  }

  parseAndNormalizeBase64Audio(base64Data: string): string {
    const normalized = normalizeBase64(base64Data);

    if (!normalized || normalized.length < 20) {
      throw new Error("Audio payload is empty.");
    }

    return normalized;
  }
}
