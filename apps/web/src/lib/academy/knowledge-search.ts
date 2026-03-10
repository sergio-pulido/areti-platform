import {
  getAllConcepts,
  getAllDomains,
  getAllPersons,
  getAllTraditions,
  getAllWorks,
  getDomainForTradition,
  getPersonForWork,
  getTraditionForPerson,
  getTraditionForWork,
} from "@/lib/academy/knowledge-selectors";
import type { AcademySearchResult } from "@/lib/academy/knowledge-types";

type SearchOptions = {
  limit?: number;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function scoreText(query: string, text: string, weight: number): number {
  if (!text) {
    return 0;
  }

  const normalizedText = normalize(text);
  if (!normalizedText) {
    return 0;
  }

  if (normalizedText === query) {
    return 120 * weight;
  }

  if (normalizedText.startsWith(query)) {
    return 80 * weight;
  }

  if (normalizedText.includes(query)) {
    return 50 * weight;
  }

  const queryTokens = query.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) {
    return 0;
  }

  let tokenMatches = 0;

  for (const token of queryTokens) {
    if (normalizedText.includes(token)) {
      tokenMatches += 1;
    }
  }

  return tokenMatches > 0 ? tokenMatches * 12 * weight : 0;
}

function createEmptySearchResult(query: string): AcademySearchResult[] {
  if (!query.trim()) {
    return [];
  }

  return [];
}

export function searchAcademy(query: string, options: SearchOptions = {}): AcademySearchResult[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return createEmptySearchResult(query);
  }

  const results: AcademySearchResult[] = [];

  for (const domain of getAllDomains()) {
    const score =
      scoreText(normalizedQuery, domain.name, 4) +
      scoreText(normalizedQuery, domain.descriptionShort ?? "", 2);

    if (score === 0) {
      continue;
    }

    results.push({
      type: "domain",
      slug: domain.slug,
      title: domain.name,
      subtitle: "Domain",
      summary: domain.descriptionShort ?? "Knowledge domain",
      href: `/academy?domain=${domain.slug}`,
      score,
      tags: ["Domain"],
    });
  }

  for (const tradition of getAllTraditions()) {
    const domain = getDomainForTradition(tradition);
    const score =
      scoreText(normalizedQuery, tradition.name, 4) +
      scoreText(normalizedQuery, tradition.slug, 3) +
      scoreText(normalizedQuery, tradition.descriptionShort ?? "", 2) +
      scoreText(normalizedQuery, tradition.originRegion ?? "", 1) +
      scoreText(normalizedQuery, domain?.name ?? "", 1);

    if (score === 0) {
      continue;
    }

    results.push({
      type: "tradition",
      slug: tradition.slug,
      title: tradition.name,
      subtitle: `Tradition · ${domain?.name ?? "Unknown domain"}`,
      summary: tradition.descriptionShort ?? "Tradition in the Academy",
      href: `/academy/traditions/${tradition.slug}`,
      score,
      tags: ["Tradition", domain?.name ?? "Unknown"],
    });
  }

  for (const person of getAllPersons()) {
    const tradition = getTraditionForPerson(person);
    const score =
      scoreText(normalizedQuery, person.displayName, 4) +
      scoreText(normalizedQuery, person.bioShort ?? "", 2) +
      scoreText(normalizedQuery, person.roleType ?? "", 2) +
      scoreText(normalizedQuery, person.countryOrRegion ?? "", 1) +
      scoreText(normalizedQuery, tradition?.name ?? "", 2);

    if (score === 0) {
      continue;
    }

    results.push({
      type: "thinker",
      slug: person.slug,
      title: person.displayName,
      subtitle: `Thinker · ${tradition?.name ?? "Independent"}`,
      summary: person.bioShort ?? "Thinker profile",
      href: `/academy/thinkers/${person.slug}`,
      score,
      tags: [
        "Thinker",
        person.credibilityBand ?? "Unclassified",
        tradition?.name ?? "Independent",
      ],
    });
  }

  for (const work of getAllWorks()) {
    const person = getPersonForWork(work);
    const tradition = getTraditionForWork(work);
    const score =
      scoreText(normalizedQuery, work.title, 4) +
      scoreText(normalizedQuery, work.summaryShort ?? "", 2) +
      scoreText(normalizedQuery, work.workType ?? "", 2) +
      scoreText(normalizedQuery, person?.displayName ?? "", 2) +
      scoreText(normalizedQuery, tradition?.name ?? "", 2);

    if (score === 0) {
      continue;
    }

    results.push({
      type: "work",
      slug: work.slug,
      title: work.title,
      subtitle: `Work · ${person?.displayName ?? "Unknown author"}`,
      summary: work.summaryShort ?? "Work in the Academy",
      href: `/academy/works/${work.slug}`,
      score,
      tags: [
        "Work",
        work.isPrimaryText ? "Primary text" : "Secondary text",
        tradition?.name ?? "Unknown tradition",
      ],
    });
  }

  for (const concept of getAllConcepts()) {
    const score =
      scoreText(normalizedQuery, concept.name, 4) +
      scoreText(normalizedQuery, concept.description ?? "", 2) +
      scoreText(normalizedQuery, concept.conceptFamily ?? "", 2);

    if (score === 0) {
      continue;
    }

    results.push({
      type: "concept",
      slug: concept.slug,
      title: concept.name,
      subtitle: `Concept · ${concept.conceptFamily ?? "General"}`,
      summary: concept.description ?? "Concept in the Academy",
      href: `/academy/concepts/${concept.slug}`,
      score,
      tags: ["Concept", concept.conceptFamily ?? "General"],
    });
  }

  const limit = options.limit ?? 40;

  return results
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
