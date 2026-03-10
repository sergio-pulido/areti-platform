import {
  getConceptBySlug,
  getPersonBySlug,
  getTraditionBySlug,
} from "@/lib/academy/knowledge-selectors";
import { getAcademyKnowledgeRepository } from "@/lib/academy/knowledge-repository";
import type { AcademyPath, AcademyPathSeed } from "@/lib/academy/knowledge-types";

const ACADEMY_PATH_SEEDS: AcademyPathSeed[] = [
  {
    slug: "stoicism-for-beginners",
    title: "Stoicism for Beginners",
    summary:
      "Build a grounded foundation with core Stoic thinkers, primary texts, and practical concepts you can apply daily.",
    tone: "beginner",
    traditionSlugs: ["stoicism"],
    personSlugs: ["seneca", "epictetus", "marcus-aurelius"],
    workIds: [1, 2, 3],
    conceptSlugs: ["virtue", "discipline", "tranquility"],
  },
  {
    slug: "buddhism-for-beginners",
    title: "Buddhism for Beginners",
    summary:
      "Explore suffering, presence, and emptiness through foundational Buddhist sources and clear introductory anchors.",
    tone: "beginner",
    traditionSlugs: ["buddhism", "zen"],
    personSlugs: ["gautama-buddha", "nagarjuna", "dogen"],
    workIds: [9, 10, 11],
    conceptSlugs: ["suffering", "emptiness", "presence"],
  },
  {
    slug: "psychology-for-self-understanding",
    title: "Psychology for Self-Understanding",
    summary:
      "Use clinical and humanistic psychology to understand patterns, attachment, and meaning with strong conceptual framing.",
    tone: "beginner",
    traditionSlugs: ["cbt", "humanistic-psychology", "attachment-theory"],
    personSlugs: ["aaron-beck", "carl-rogers", "john-bowlby"],
    workIds: [29, 31, 34],
    conceptSlugs: ["attachment", "meaning", "habit"],
  },
  {
    slug: "meaning-and-purpose",
    title: "Meaning and Purpose",
    summary:
      "A guided route through existential and logotherapeutic sources for people looking for direction and resilient purpose.",
    tone: "intermediate",
    traditionSlugs: ["existentialism", "humanistic-psychology"],
    personSlugs: ["kierkegaard", "camus", "viktor-frankl"],
    workIds: [6, 8, 33],
    conceptSlugs: ["meaning", "suffering", "virtue"],
  },
  {
    slug: "habits-and-discipline",
    title: "Habits and Discipline",
    summary:
      "Combine foundational discipline ideas with modern execution systems while keeping evidence and credibility clearly separated.",
    tone: "beginner",
    traditionSlugs: ["habits-productivity", "discipline-resilience", "stoicism"],
    personSlugs: ["james-clear", "cal-newport", "epictetus"],
    workIds: [2, 37, 38],
    conceptSlugs: ["habit", "discipline", "presence"],
  },
];

function resolvePath(seed: AcademyPathSeed): AcademyPath {
  const repository = getAcademyKnowledgeRepository();

  const traditions = seed.traditionSlugs
    .map((slug) => getTraditionBySlug(slug))
    .filter((tradition): tradition is NonNullable<typeof tradition> => tradition !== null);

  const persons = seed.personSlugs
    .map((slug) => getPersonBySlug(slug))
    .filter((person): person is NonNullable<typeof person> => person !== null);

  const works = seed.workIds
    .map((id) => repository.worksById.get(id) ?? null)
    .filter((work): work is NonNullable<typeof work> => work !== null);

  const concepts = seed.conceptSlugs
    .map((slug) => getConceptBySlug(slug))
    .filter((concept): concept is NonNullable<typeof concept> => concept !== null);

  return {
    slug: seed.slug,
    title: seed.title,
    summary: seed.summary,
    tone: seed.tone,
    traditions,
    persons,
    works,
    concepts,
  };
}

export function getAcademyPaths(): AcademyPath[] {
  return ACADEMY_PATH_SEEDS.map(resolvePath);
}

export function getAcademyPathBySlug(slug: string): AcademyPath | null {
  const matched = ACADEMY_PATH_SEEDS.find((path) => path.slug === slug);

  if (!matched) {
    return null;
  }

  return resolvePath(matched);
}
