export type AcademyConceptTraditionLinkSeed = {
  conceptSlug: string;
  traditionSlug: string;
  sortOrder: number;
};

export type AcademyConceptPersonLinkSeed = {
  conceptSlug: string;
  personSlug: string;
  sortOrder: number;
};

export type AcademyConceptWorkLinkSeed = {
  conceptSlug: string;
  workId: number;
  sortOrder: number;
};

export const ACADEMY_CONCEPT_TRADITION_LINKS: AcademyConceptTraditionLinkSeed[] = [
  { conceptSlug: "virtue", traditionSlug: "stoicism", sortOrder: 1 },
  { conceptSlug: "virtue", traditionSlug: "confucianism", sortOrder: 2 },
  { conceptSlug: "virtue", traditionSlug: "existentialism", sortOrder: 3 },
  { conceptSlug: "tranquility", traditionSlug: "epicureanism", sortOrder: 1 },
  { conceptSlug: "tranquility", traditionSlug: "stoicism", sortOrder: 2 },
  { conceptSlug: "tranquility", traditionSlug: "taoism", sortOrder: 3 },
  { conceptSlug: "suffering", traditionSlug: "buddhism", sortOrder: 1 },
  { conceptSlug: "suffering", traditionSlug: "humanistic-psychology", sortOrder: 2 },
  { conceptSlug: "suffering", traditionSlug: "existentialism", sortOrder: 3 },
  { conceptSlug: "emptiness", traditionSlug: "buddhism", sortOrder: 1 },
  { conceptSlug: "emptiness", traditionSlug: "zen", sortOrder: 2 },
  { conceptSlug: "emptiness", traditionSlug: "dzogchen", sortOrder: 3 },
  { conceptSlug: "presence", traditionSlug: "zen", sortOrder: 1 },
  { conceptSlug: "presence", traditionSlug: "taoism", sortOrder: 2 },
  {
    conceptSlug: "presence",
    traditionSlug: "money-meaning-modern-spirituality",
    sortOrder: 3,
  },
  { conceptSlug: "discipline", traditionSlug: "stoicism", sortOrder: 1 },
  { conceptSlug: "discipline", traditionSlug: "discipline-resilience", sortOrder: 2 },
  { conceptSlug: "discipline", traditionSlug: "habits-productivity", sortOrder: 3 },
  { conceptSlug: "meaning", traditionSlug: "existentialism", sortOrder: 1 },
  { conceptSlug: "meaning", traditionSlug: "humanistic-psychology", sortOrder: 2 },
  {
    conceptSlug: "meaning",
    traditionSlug: "money-meaning-modern-spirituality",
    sortOrder: 3,
  },
  { conceptSlug: "attachment", traditionSlug: "attachment-theory", sortOrder: 1 },
  { conceptSlug: "attachment", traditionSlug: "psychoanalysis", sortOrder: 2 },
  { conceptSlug: "attachment", traditionSlug: "humanistic-psychology", sortOrder: 3 },
  { conceptSlug: "habit", traditionSlug: "habits-productivity", sortOrder: 1 },
  { conceptSlug: "habit", traditionSlug: "cbt", sortOrder: 2 },
  { conceptSlug: "habit", traditionSlug: "stoicism", sortOrder: 3 },
  {
    conceptSlug: "wealth",
    traditionSlug: "money-meaning-modern-spirituality",
    sortOrder: 1,
  },
  { conceptSlug: "wealth", traditionSlug: "social-psychology", sortOrder: 2 },
];

export const ACADEMY_CONCEPT_PERSON_LINKS: AcademyConceptPersonLinkSeed[] = [
  { conceptSlug: "virtue", personSlug: "zeno-of-citium", sortOrder: 1 },
  { conceptSlug: "virtue", personSlug: "seneca", sortOrder: 2 },
  { conceptSlug: "virtue", personSlug: "epictetus", sortOrder: 3 },
  { conceptSlug: "virtue", personSlug: "marcus-aurelius", sortOrder: 4 },
  { conceptSlug: "virtue", personSlug: "confucius", sortOrder: 5 },
  { conceptSlug: "tranquility", personSlug: "epicurus", sortOrder: 1 },
  { conceptSlug: "tranquility", personSlug: "seneca", sortOrder: 2 },
  { conceptSlug: "tranquility", personSlug: "laozi", sortOrder: 3 },
  { conceptSlug: "tranquility", personSlug: "zhuangzi", sortOrder: 4 },
  { conceptSlug: "suffering", personSlug: "gautama-buddha", sortOrder: 1 },
  { conceptSlug: "suffering", personSlug: "nagarjuna", sortOrder: 2 },
  { conceptSlug: "suffering", personSlug: "camus", sortOrder: 3 },
  { conceptSlug: "suffering", personSlug: "viktor-frankl", sortOrder: 4 },
  { conceptSlug: "emptiness", personSlug: "nagarjuna", sortOrder: 1 },
  { conceptSlug: "emptiness", personSlug: "dogen", sortOrder: 2 },
  { conceptSlug: "emptiness", personSlug: "longchenpa", sortOrder: 3 },
  { conceptSlug: "presence", personSlug: "dogen", sortOrder: 1 },
  { conceptSlug: "presence", personSlug: "laozi", sortOrder: 2 },
  { conceptSlug: "presence", personSlug: "eckhart-tolle", sortOrder: 3 },
  { conceptSlug: "discipline", personSlug: "epictetus", sortOrder: 1 },
  { conceptSlug: "discipline", personSlug: "marcus-aurelius", sortOrder: 2 },
  { conceptSlug: "discipline", personSlug: "david-goggins", sortOrder: 3 },
  { conceptSlug: "discipline", personSlug: "jocko-willink", sortOrder: 4 },
  { conceptSlug: "meaning", personSlug: "kierkegaard", sortOrder: 1 },
  { conceptSlug: "meaning", personSlug: "camus", sortOrder: 2 },
  { conceptSlug: "meaning", personSlug: "viktor-frankl", sortOrder: 3 },
  { conceptSlug: "meaning", personSlug: "morgan-housel", sortOrder: 4 },
  { conceptSlug: "attachment", personSlug: "john-bowlby", sortOrder: 1 },
  { conceptSlug: "attachment", personSlug: "freud", sortOrder: 2 },
  { conceptSlug: "attachment", personSlug: "jung", sortOrder: 3 },
  { conceptSlug: "habit", personSlug: "james-clear", sortOrder: 1 },
  { conceptSlug: "habit", personSlug: "cal-newport", sortOrder: 2 },
  { conceptSlug: "habit", personSlug: "aaron-beck", sortOrder: 3 },
  { conceptSlug: "wealth", personSlug: "morgan-housel", sortOrder: 1 },
  { conceptSlug: "wealth", personSlug: "robert-cialdini", sortOrder: 2 },
  { conceptSlug: "wealth", personSlug: "dale-carnegie", sortOrder: 3 },
];

export const ACADEMY_CONCEPT_WORK_LINKS: AcademyConceptWorkLinkSeed[] = [
  { conceptSlug: "virtue", workId: 1, sortOrder: 1 },
  { conceptSlug: "virtue", workId: 2, sortOrder: 2 },
  { conceptSlug: "virtue", workId: 3, sortOrder: 3 },
  { conceptSlug: "virtue", workId: 15, sortOrder: 4 },
  { conceptSlug: "tranquility", workId: 1, sortOrder: 1 },
  { conceptSlug: "tranquility", workId: 4, sortOrder: 2 },
  { conceptSlug: "tranquility", workId: 5, sortOrder: 3 },
  { conceptSlug: "tranquility", workId: 13, sortOrder: 4 },
  { conceptSlug: "suffering", workId: 8, sortOrder: 1 },
  { conceptSlug: "suffering", workId: 9, sortOrder: 2 },
  { conceptSlug: "suffering", workId: 10, sortOrder: 3 },
  { conceptSlug: "suffering", workId: 33, sortOrder: 4 },
  { conceptSlug: "emptiness", workId: 10, sortOrder: 1 },
  { conceptSlug: "emptiness", workId: 11, sortOrder: 2 },
  { conceptSlug: "emptiness", workId: 12, sortOrder: 3 },
  { conceptSlug: "presence", workId: 11, sortOrder: 1 },
  { conceptSlug: "presence", workId: 13, sortOrder: 2 },
  { conceptSlug: "presence", workId: 43, sortOrder: 3 },
  { conceptSlug: "discipline", workId: 2, sortOrder: 1 },
  { conceptSlug: "discipline", workId: 3, sortOrder: 2 },
  { conceptSlug: "discipline", workId: 40, sortOrder: 3 },
  { conceptSlug: "discipline", workId: 41, sortOrder: 4 },
  { conceptSlug: "meaning", workId: 6, sortOrder: 1 },
  { conceptSlug: "meaning", workId: 8, sortOrder: 2 },
  { conceptSlug: "meaning", workId: 33, sortOrder: 3 },
  { conceptSlug: "meaning", workId: 42, sortOrder: 4 },
  { conceptSlug: "attachment", workId: 27, sortOrder: 1 },
  { conceptSlug: "attachment", workId: 28, sortOrder: 2 },
  { conceptSlug: "attachment", workId: 34, sortOrder: 3 },
  { conceptSlug: "habit", workId: 2, sortOrder: 1 },
  { conceptSlug: "habit", workId: 29, sortOrder: 2 },
  { conceptSlug: "habit", workId: 37, sortOrder: 3 },
  { conceptSlug: "habit", workId: 38, sortOrder: 4 },
  { conceptSlug: "wealth", workId: 35, sortOrder: 1 },
  { conceptSlug: "wealth", workId: 42, sortOrder: 2 },
  { conceptSlug: "wealth", workId: 45, sortOrder: 3 },
];

export type AcademyPathEntityType = "tradition" | "person" | "work" | "concept";

export type AcademyPathItemSeed = {
  entityType: AcademyPathEntityType;
  slugOrWorkId: string | number;
  sortOrder: number;
  rationale: string;
};

export type AcademyPathSeed = {
  slug: string;
  title: string;
  summary: string;
  tone: "beginner" | "intermediate";
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  progressionOrder: number;
  recommendationWeight: number;
  recommendationHint: string;
  isFeatured: boolean;
  items: AcademyPathItemSeed[];
};

export const ACADEMY_PATHS_SEED: AcademyPathSeed[] = [
  {
    slug: "stoicism-for-beginners",
    title: "Stoicism for Beginners",
    summary:
      "Build a grounded foundation with core Stoic thinkers, primary texts, and practical concepts you can apply daily.",
    tone: "beginner",
    difficultyLevel: "beginner",
    progressionOrder: 1,
    recommendationWeight: 95,
    recommendationHint: "Best for users seeking emotional stability and disciplined action.",
    isFeatured: true,
    items: [
      { entityType: "tradition", slugOrWorkId: "stoicism", sortOrder: 1, rationale: "Root school" },
      { entityType: "person", slugOrWorkId: "seneca", sortOrder: 2, rationale: "Applied ethics" },
      { entityType: "person", slugOrWorkId: "epictetus", sortOrder: 3, rationale: "Control and agency" },
      {
        entityType: "person",
        slugOrWorkId: "marcus-aurelius",
        sortOrder: 4,
        rationale: "Leadership under pressure",
      },
      { entityType: "work", slugOrWorkId: 1, sortOrder: 5, rationale: "Letters as practical format" },
      { entityType: "work", slugOrWorkId: 2, sortOrder: 6, rationale: "Method and mental discipline" },
      { entityType: "work", slugOrWorkId: 3, sortOrder: 7, rationale: "Daily reflection model" },
      { entityType: "concept", slugOrWorkId: "virtue", sortOrder: 8, rationale: "Core axis" },
      { entityType: "concept", slugOrWorkId: "discipline", sortOrder: 9, rationale: "Behavioral grounding" },
      { entityType: "concept", slugOrWorkId: "tranquility", sortOrder: 10, rationale: "Outcome goal" },
    ],
  },
  {
    slug: "buddhism-for-beginners",
    title: "Buddhism for Beginners",
    summary:
      "Explore suffering, presence, and emptiness through foundational Buddhist sources and clear introductory anchors.",
    tone: "beginner",
    difficultyLevel: "beginner",
    progressionOrder: 2,
    recommendationWeight: 90,
    recommendationHint: "Best for users working with suffering and attentional training.",
    isFeatured: true,
    items: [
      { entityType: "tradition", slugOrWorkId: "buddhism", sortOrder: 1, rationale: "Foundational frame" },
      { entityType: "tradition", slugOrWorkId: "zen", sortOrder: 2, rationale: "Practice current" },
      {
        entityType: "person",
        slugOrWorkId: "gautama-buddha",
        sortOrder: 3,
        rationale: "Origin teacher",
      },
      { entityType: "person", slugOrWorkId: "nagarjuna", sortOrder: 4, rationale: "Philosophical depth" },
      { entityType: "person", slugOrWorkId: "dogen", sortOrder: 5, rationale: "Practice + realization" },
      { entityType: "work", slugOrWorkId: 9, sortOrder: 6, rationale: "Introductory canon" },
      { entityType: "work", slugOrWorkId: 10, sortOrder: 7, rationale: "Emptiness framework" },
      { entityType: "work", slugOrWorkId: 11, sortOrder: 8, rationale: "Practical embodiment" },
      { entityType: "concept", slugOrWorkId: "suffering", sortOrder: 9, rationale: "Entry concept" },
      { entityType: "concept", slugOrWorkId: "emptiness", sortOrder: 10, rationale: "Metaphysical insight" },
      { entityType: "concept", slugOrWorkId: "presence", sortOrder: 11, rationale: "Operational practice" },
    ],
  },
  {
    slug: "psychology-for-self-understanding",
    title: "Psychology for Self-Understanding",
    summary:
      "Use clinical and humanistic psychology to understand patterns, attachment, and meaning with strong conceptual framing.",
    tone: "beginner",
    difficultyLevel: "intermediate",
    progressionOrder: 3,
    recommendationWeight: 88,
    recommendationHint: "Best for users wanting evidence-oriented self-understanding.",
    isFeatured: true,
    items: [
      { entityType: "tradition", slugOrWorkId: "cbt", sortOrder: 1, rationale: "Evidence-based intervention" },
      {
        entityType: "tradition",
        slugOrWorkId: "humanistic-psychology",
        sortOrder: 2,
        rationale: "Meaning and personhood",
      },
      {
        entityType: "tradition",
        slugOrWorkId: "attachment-theory",
        sortOrder: 3,
        rationale: "Relational blueprint",
      },
      { entityType: "person", slugOrWorkId: "aaron-beck", sortOrder: 4, rationale: "Cognitive therapy" },
      { entityType: "person", slugOrWorkId: "carl-rogers", sortOrder: 5, rationale: "Person-centered lens" },
      { entityType: "person", slugOrWorkId: "john-bowlby", sortOrder: 6, rationale: "Attachment model" },
      {
        entityType: "work",
        slugOrWorkId: 29,
        sortOrder: 7,
        rationale: "Clinical cognitive foundation",
      },
      {
        entityType: "work",
        slugOrWorkId: 31,
        sortOrder: 8,
        rationale: "Humanistic therapy anchor",
      },
      {
        entityType: "work",
        slugOrWorkId: 34,
        sortOrder: 9,
        rationale: "Attachment evidence base",
      },
      { entityType: "concept", slugOrWorkId: "attachment", sortOrder: 10, rationale: "Core dynamic" },
      { entityType: "concept", slugOrWorkId: "meaning", sortOrder: 11, rationale: "Purpose layer" },
      { entityType: "concept", slugOrWorkId: "habit", sortOrder: 12, rationale: "Behavioral execution" },
    ],
  },
  {
    slug: "meaning-and-purpose",
    title: "Meaning and Purpose",
    summary:
      "A guided route through existential and logotherapeutic sources for people looking for direction and resilient purpose.",
    tone: "intermediate",
    difficultyLevel: "intermediate",
    progressionOrder: 4,
    recommendationWeight: 82,
    recommendationHint: "Best for users in transition, identity questioning, or value reorientation.",
    isFeatured: false,
    items: [
      { entityType: "tradition", slugOrWorkId: "existentialism", sortOrder: 1, rationale: "Core frame" },
      {
        entityType: "tradition",
        slugOrWorkId: "humanistic-psychology",
        sortOrder: 2,
        rationale: "Applied bridge",
      },
      { entityType: "person", slugOrWorkId: "kierkegaard", sortOrder: 3, rationale: "Anxiety and selfhood" },
      { entityType: "person", slugOrWorkId: "camus", sortOrder: 4, rationale: "Absurd and revolt" },
      { entityType: "person", slugOrWorkId: "viktor-frankl", sortOrder: 5, rationale: "Meaning in suffering" },
      { entityType: "work", slugOrWorkId: 6, sortOrder: 6, rationale: "Despair analysis" },
      { entityType: "work", slugOrWorkId: 8, sortOrder: 7, rationale: "Absurdity response" },
      { entityType: "work", slugOrWorkId: 33, sortOrder: 8, rationale: "Logotherapy classic" },
      { entityType: "concept", slugOrWorkId: "meaning", sortOrder: 9, rationale: "Path anchor" },
      { entityType: "concept", slugOrWorkId: "suffering", sortOrder: 10, rationale: "Reality test" },
      { entityType: "concept", slugOrWorkId: "virtue", sortOrder: 11, rationale: "Action orientation" },
    ],
  },
  {
    slug: "habits-and-discipline",
    title: "Habits and Discipline",
    summary:
      "Combine foundational discipline ideas with modern execution systems while keeping evidence and credibility clearly separated.",
    tone: "beginner",
    difficultyLevel: "beginner",
    progressionOrder: 5,
    recommendationWeight: 86,
    recommendationHint: "Best for users optimizing routines, consistency, and execution quality.",
    isFeatured: true,
    items: [
      {
        entityType: "tradition",
        slugOrWorkId: "habits-productivity",
        sortOrder: 1,
        rationale: "Applied systems",
      },
      {
        entityType: "tradition",
        slugOrWorkId: "discipline-resilience",
        sortOrder: 2,
        rationale: "Mental toughness",
      },
      { entityType: "tradition", slugOrWorkId: "stoicism", sortOrder: 3, rationale: "Character discipline" },
      { entityType: "person", slugOrWorkId: "james-clear", sortOrder: 4, rationale: "Habit architecture" },
      { entityType: "person", slugOrWorkId: "cal-newport", sortOrder: 5, rationale: "Focus and depth" },
      { entityType: "person", slugOrWorkId: "epictetus", sortOrder: 6, rationale: "Agency training" },
      { entityType: "work", slugOrWorkId: 2, sortOrder: 7, rationale: "Ancient execution psychology" },
      { entityType: "work", slugOrWorkId: 37, sortOrder: 8, rationale: "Modern habit model" },
      { entityType: "work", slugOrWorkId: 38, sortOrder: 9, rationale: "Attention discipline" },
      { entityType: "concept", slugOrWorkId: "habit", sortOrder: 10, rationale: "Behavior engine" },
      { entityType: "concept", slugOrWorkId: "discipline", sortOrder: 11, rationale: "Consistency trait" },
      { entityType: "concept", slugOrWorkId: "presence", sortOrder: 12, rationale: "Attentional quality" },
    ],
  },
];
