export type ReflectionPromptInput = {
  rawText: string;
  cleanTranscript?: string;
  refinedText?: string;
  language?: string;
};

function languageHint(language?: string): string {
  const normalized = language?.trim();
  return normalized && normalized.length > 0
    ? `Respond in ${normalized}, unless the source clearly uses another language.`
    : "Respond in the same language as the source text.";
}

export function buildCleanTranscriptPrompt(input: ReflectionPromptInput): string {
  return [
    "Task: clean the transcript while preserving meaning and personal voice.",
    "Rules:",
    "- Keep intent and factual meaning unchanged.",
    "- Remove filler words only when they hurt readability.",
    "- Fix punctuation, spacing, and obvious transcription artifacts.",
    "- Do not add interpretation, advice, or new content.",
    "- Output only the cleaned transcript.",
    languageHint(input.language),
    "",
    "Source text:",
    input.rawText.trim(),
  ].join("\n");
}

export function buildRefinedReflectionPrompt(input: ReflectionPromptInput): string {
  const clean = input.cleanTranscript?.trim() || input.rawText.trim();

  return [
    "Task: rewrite the reflection so it reads clearly and cohesively.",
    "Rules:",
    "- Preserve the original meaning, nuance, and emotional tone.",
    "- Keep a first-person perspective if the source uses it.",
    "- Improve structure, flow, and sentence clarity.",
    "- Avoid generic inspiration, motivational fluff, or moralizing.",
    "- Do not sound like a therapist, guru, or life coach.",
    "- Output only the refined reflection text.",
    languageHint(input.language),
    "",
    "Source text:",
    clean,
  ].join("\n");
}

export function buildCommentaryPrompt(input: ReflectionPromptInput): string {
  const source = input.refinedText?.trim() || input.cleanTranscript?.trim() || input.rawText.trim();

  return [
    "Task: provide a brief commentary on this reflection.",
    "Rules:",
    "- 2 to 4 short sentences.",
    "- Calm, clear, and practical tone.",
    "- Highlight one tension, contradiction, pattern, or next useful question.",
    "- No therapy framing, diagnosis, or emotional labeling.",
    "- No flattery, hype, or fake-deep language.",
    "- Avoid heavy jargon and keep it concise.",
    "- Output only the commentary text.",
    languageHint(input.language),
    "",
    "Reflection:",
    source,
  ].join("\n");
}
