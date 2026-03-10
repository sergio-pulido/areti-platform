import { apiAcademyQuery } from "@/lib/backend-api";

export type AcademyStarterPathSuggestion = {
  label: string;
  prompt: string;
  pathSlug: string;
  pathTitle: string;
  hint: string;
};

export type AcademyGuidedFollowUpSuggestion = {
  label: string;
  prompt: string;
  source: "concept" | "path";
  slug: string;
};

function normalizeAdapterQuery(context: string | undefined): string {
  return (context ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
}

export async function buildStarterPathSuggestions(
  token: string,
  context: string | undefined,
): Promise<AcademyStarterPathSuggestion[]> {
  const query = normalizeAdapterQuery(context);
  const payload = await apiAcademyQuery(token, {
    entity: "paths",
    q: query || undefined,
    includeRelations: true,
    limit: 5,
  });

  const suggestions = payload.paths.map((path) => {
    const promptContext = query
      ? `I am working through this context: "${query}".`
      : "I want to start a structured Academy study path.";

    return {
      label: path.title,
      prompt: `${promptContext} Recommend how to start the \"${path.title}\" path with one first step today, one weekly plan, and one reflection question.`,
      pathSlug: path.slug,
      pathTitle: path.title,
      hint: path.recommendationHint,
    };
  });

  return suggestions;
}

export async function buildGuidedFollowUps(
  token: string,
  context: string | undefined,
): Promise<AcademyGuidedFollowUpSuggestion[]> {
  const query = normalizeAdapterQuery(context);

  const [conceptPayload, pathPayload] = await Promise.all([
    apiAcademyQuery(token, {
      entity: "concepts",
      q: query || undefined,
      includeRelations: true,
      limit: 3,
    }),
    apiAcademyQuery(token, {
      entity: "paths",
      q: query || undefined,
      includeRelations: false,
      limit: 2,
    }),
  ]);

  const conceptPrompts: AcademyGuidedFollowUpSuggestion[] = conceptPayload.concepts.map((concept) => ({
    label: `Deepen with ${concept.name}`,
    prompt: `Guide me deeper using the Academy concept \"${concept.name}\". Give one challenge question and one concrete step for this week.`,
    source: "concept",
    slug: concept.slug,
  }));

  const pathPrompts: AcademyGuidedFollowUpSuggestion[] = pathPayload.paths.map((path) => ({
    label: `Apply ${path.title}`,
    prompt: `Use the Academy path \"${path.title}\" as a follow-up. What should I read first, and how should I practice it this week?`,
    source: "path",
    slug: path.slug,
  }));

  return [...conceptPrompts, ...pathPrompts].slice(0, 4);
}

export async function buildAcademyAgentAdapters(input: {
  token: string;
  context?: string;
}): Promise<{
  starterPathSuggestions: AcademyStarterPathSuggestion[];
  guidedFollowUps: AcademyGuidedFollowUpSuggestion[];
}> {
  const [starterPathSuggestions, guidedFollowUps] = await Promise.all([
    buildStarterPathSuggestions(input.token, input.context),
    buildGuidedFollowUps(input.token, input.context),
  ]);

  return {
    starterPathSuggestions,
    guidedFollowUps,
  };
}
