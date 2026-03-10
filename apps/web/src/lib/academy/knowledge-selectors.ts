import { getAcademyKnowledgeRepository } from "@/lib/academy/knowledge-repository";
import type {
  AcademyConcept,
  AcademyConceptLinkSeed,
  AcademyConceptLinks,
  AcademyDomain,
  AcademyPerson,
  AcademyPersonRelationship,
  AcademyTradition,
  AcademyWork,
} from "@/lib/academy/knowledge-types";

const CREDIBILITY_ORDER: Record<string, number> = {
  foundational: 1,
  major: 2,
  secondary: 3,
  popularizer: 4,
  controversial: 5,
};

const CONCEPT_LINK_SEED: Record<string, AcademyConceptLinkSeed> = {
  virtue: {
    traditionSlugs: ["stoicism", "confucianism", "existentialism"],
    personSlugs: ["zeno-of-citium", "seneca", "epictetus", "marcus-aurelius", "confucius"],
    workIds: [1, 2, 3, 15],
  },
  tranquility: {
    traditionSlugs: ["epicureanism", "stoicism", "taoism"],
    personSlugs: ["epicurus", "seneca", "laozi", "zhuangzi"],
    workIds: [1, 4, 5, 13],
  },
  suffering: {
    traditionSlugs: ["buddhism", "humanistic-psychology", "existentialism"],
    personSlugs: ["gautama-buddha", "nagarjuna", "camus", "viktor-frankl"],
    workIds: [8, 9, 10, 33],
  },
  emptiness: {
    traditionSlugs: ["buddhism", "zen", "dzogchen"],
    personSlugs: ["nagarjuna", "dogen", "longchenpa"],
    workIds: [10, 11, 12],
  },
  presence: {
    traditionSlugs: ["zen", "taoism", "money-meaning-modern-spirituality"],
    personSlugs: ["dogen", "laozi", "eckhart-tolle"],
    workIds: [11, 13, 43],
  },
  discipline: {
    traditionSlugs: ["stoicism", "discipline-resilience", "habits-productivity"],
    personSlugs: ["epictetus", "marcus-aurelius", "david-goggins", "jocko-willink"],
    workIds: [2, 3, 40, 41],
  },
  meaning: {
    traditionSlugs: ["existentialism", "humanistic-psychology", "money-meaning-modern-spirituality"],
    personSlugs: ["kierkegaard", "camus", "viktor-frankl", "morgan-housel"],
    workIds: [6, 8, 33, 42],
  },
  attachment: {
    traditionSlugs: ["attachment-theory", "psychoanalysis", "humanistic-psychology"],
    personSlugs: ["john-bowlby", "freud", "jung"],
    workIds: [27, 28, 34],
  },
  habit: {
    traditionSlugs: ["habits-productivity", "cbt", "stoicism"],
    personSlugs: ["james-clear", "cal-newport", "aaron-beck"],
    workIds: [2, 29, 37, 38],
  },
  wealth: {
    traditionSlugs: ["money-meaning-modern-spirituality", "social-psychology"],
    personSlugs: ["morgan-housel", "robert-cialdini", "dale-carnegie"],
    workIds: [35, 42, 45],
  },
};

type ConceptLinkMap = Map<string, AcademyConceptLinks>;

let conceptLinkMapCache: ConceptLinkMap | null = null;

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name);
}

function byDisplayName(a: AcademyPerson, b: AcademyPerson): number {
  const aRank = CREDIBILITY_ORDER[a.credibilityBand ?? ""] ?? 99;
  const bRank = CREDIBILITY_ORDER[b.credibilityBand ?? ""] ?? 99;

  if (aRank !== bRank) {
    return aRank - bRank;
  }

  if (a.isFounder !== b.isFounder) {
    return a.isFounder ? -1 : 1;
  }

  return a.displayName.localeCompare(b.displayName);
}

function byWorkPriority(a: AcademyWork, b: AcademyWork): number {
  if (a.isPrimaryText !== b.isPrimaryText) {
    return a.isPrimaryText ? -1 : 1;
  }

  const aYear = a.publicationYear ?? Number.POSITIVE_INFINITY;
  const bYear = b.publicationYear ?? Number.POSITIVE_INFINITY;

  if (aYear !== bYear) {
    return aYear - bYear;
  }

  return a.title.localeCompare(b.title);
}

function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const map = new Map<number, T>();

  for (const item of items) {
    map.set(item.id, item);
  }

  return [...map.values()];
}

function resolveConceptLinks(): ConceptLinkMap {
  if (conceptLinkMapCache) {
    return conceptLinkMapCache;
  }

  const repository = getAcademyKnowledgeRepository();
  const map: ConceptLinkMap = new Map();

  for (const [conceptSlug, seed] of Object.entries(CONCEPT_LINK_SEED)) {
    const traditions = uniqueById(
      seed.traditionSlugs
        .map((slug) => repository.traditionsBySlug.get(slug) ?? null)
        .filter((tradition): tradition is AcademyTradition => tradition !== null),
    ).sort(byName);

    const persons = uniqueById(
      seed.personSlugs
        .map((slug) => repository.personsBySlug.get(slug) ?? null)
        .filter((person): person is AcademyPerson => person !== null),
    ).sort(byDisplayName);

    const works = uniqueById(
      seed.workIds
        .map((workId) => repository.worksById.get(workId) ?? null)
        .filter((work): work is AcademyWork => work !== null),
    ).sort(byWorkPriority);

    map.set(conceptSlug, {
      traditions,
      persons,
      works,
    });
  }

  conceptLinkMapCache = map;
  return map;
}

export function getAllDomains(): AcademyDomain[] {
  const repository = getAcademyKnowledgeRepository();
  return [...repository.dataset.domains].sort(byName);
}

export function getDomainBySlug(slug: string): AcademyDomain | null {
  const repository = getAcademyKnowledgeRepository();
  return repository.domainsBySlug.get(slug) ?? null;
}

export function getAllTraditions(): AcademyTradition[] {
  const repository = getAcademyKnowledgeRepository();
  return [...repository.dataset.traditions].sort(byName);
}

export function getTraditionsByDomain(domainId: number): AcademyTradition[] {
  const repository = getAcademyKnowledgeRepository();
  return [...(repository.traditionsByDomainId.get(domainId) ?? [])].sort(byName);
}

export function getTraditionBySlug(slug: string): AcademyTradition | null {
  const repository = getAcademyKnowledgeRepository();
  return repository.traditionsBySlug.get(slug) ?? null;
}

export function getParentTradition(tradition: AcademyTradition): AcademyTradition | null {
  if (!tradition.parentTraditionId) {
    return null;
  }

  const repository = getAcademyKnowledgeRepository();
  return repository.traditionsById.get(tradition.parentTraditionId) ?? null;
}

export function getChildTraditions(parentTraditionId: number): AcademyTradition[] {
  const repository = getAcademyKnowledgeRepository();
  return [...(repository.childTraditionsByParentId.get(parentTraditionId) ?? [])].sort(byName);
}

export function getDomainForTradition(tradition: AcademyTradition): AcademyDomain | null {
  const repository = getAcademyKnowledgeRepository();
  return repository.domainsById.get(tradition.domainId) ?? null;
}

export function getRelatedTraditions(tradition: AcademyTradition): AcademyTradition[] {
  const sameDomain = getTraditionsByDomain(tradition.domainId).filter((item) => item.id !== tradition.id);
  const parent = getParentTradition(tradition);
  const children = getChildTraditions(tradition.id);

  return uniqueById([
    ...(parent ? [parent] : []),
    ...children,
    ...sameDomain,
  ]).sort(byName);
}

export function getAllPersons(): AcademyPerson[] {
  const repository = getAcademyKnowledgeRepository();
  return [...repository.dataset.persons].sort(byDisplayName);
}

export function getPersonBySlug(slug: string): AcademyPerson | null {
  const repository = getAcademyKnowledgeRepository();
  return repository.personsBySlug.get(slug) ?? null;
}

export function getPersonsByTradition(traditionId: number): AcademyPerson[] {
  const repository = getAcademyKnowledgeRepository();
  return [...(repository.personsByTraditionId.get(traditionId) ?? [])].sort(byDisplayName);
}

export function getPersonsByDomain(domainId: number): AcademyPerson[] {
  const traditions = getTraditionsByDomain(domainId);
  const persons = traditions.flatMap((tradition) => getPersonsByTradition(tradition.id));
  return uniqueById(persons).sort(byDisplayName);
}

export function getTraditionForPerson(person: AcademyPerson): AcademyTradition | null {
  if (!person.traditionId) {
    return null;
  }

  const repository = getAcademyKnowledgeRepository();
  return repository.traditionsById.get(person.traditionId) ?? null;
}

export function getAllWorks(): AcademyWork[] {
  const repository = getAcademyKnowledgeRepository();
  return [...repository.dataset.works].sort(byWorkPriority);
}

export function getWorkBySlug(slug: string): AcademyWork | null {
  const repository = getAcademyKnowledgeRepository();
  return repository.worksBySlug.get(slug) ?? null;
}

export function getWorksByPerson(personId: number): AcademyWork[] {
  const repository = getAcademyKnowledgeRepository();
  return [...(repository.worksByPersonId.get(personId) ?? [])].sort(byWorkPriority);
}

export function getWorksByTradition(traditionId: number): AcademyWork[] {
  const repository = getAcademyKnowledgeRepository();
  return [...(repository.worksByTraditionId.get(traditionId) ?? [])].sort(byWorkPriority);
}

export function getPersonForWork(work: AcademyWork): AcademyPerson | null {
  if (!work.personId) {
    return null;
  }

  const repository = getAcademyKnowledgeRepository();
  return repository.personsById.get(work.personId) ?? null;
}

export function getTraditionForWork(work: AcademyWork): AcademyTradition | null {
  if (!work.traditionId) {
    return null;
  }

  const repository = getAcademyKnowledgeRepository();
  return repository.traditionsById.get(work.traditionId) ?? null;
}

export function getRelatedWorks(work: AcademyWork, limit = 6): AcademyWork[] {
  const samePerson = work.personId ? getWorksByPerson(work.personId) : [];
  const sameTradition = work.traditionId ? getWorksByTradition(work.traditionId) : [];

  return uniqueById([...samePerson, ...sameTradition])
    .filter((candidate) => candidate.id !== work.id)
    .sort(byWorkPriority)
    .slice(0, limit);
}

export function getAllConcepts(): AcademyConcept[] {
  const repository = getAcademyKnowledgeRepository();
  return [...repository.dataset.concepts].sort(byName);
}

export function getConceptBySlug(slug: string): AcademyConcept | null {
  const repository = getAcademyKnowledgeRepository();
  return repository.conceptsBySlug.get(slug) ?? null;
}

export function getConceptLinksBySlug(conceptSlug: string): AcademyConceptLinks {
  const links = resolveConceptLinks().get(conceptSlug);

  if (links) {
    return links;
  }

  return {
    traditions: [],
    persons: [],
    works: [],
  };
}

export function getRelatedConceptsForTradition(traditionId: number): AcademyConcept[] {
  const concepts = getAllConcepts().filter((concept) =>
    getConceptLinksBySlug(concept.slug).traditions.some((tradition) => tradition.id === traditionId),
  );

  return concepts.sort(byName);
}

export function getRelatedConceptsForPerson(personId: number): AcademyConcept[] {
  const concepts = getAllConcepts().filter((concept) =>
    getConceptLinksBySlug(concept.slug).persons.some((person) => person.id === personId),
  );

  return concepts.sort(byName);
}

export function getRelatedConceptsForWork(workId: number): AcademyConcept[] {
  const concepts = getAllConcepts().filter((concept) =>
    getConceptLinksBySlug(concept.slug).works.some((work) => work.id === workId),
  );

  return concepts.sort(byName);
}

export function getPersonRelationshipsFrom(personId: number): AcademyPersonRelationship[] {
  const repository = getAcademyKnowledgeRepository();
  return [...(repository.personRelationshipsBySourceId.get(personId) ?? [])];
}

export function getPersonRelationshipsTo(personId: number): AcademyPersonRelationship[] {
  const repository = getAcademyKnowledgeRepository();
  return [...(repository.personRelationshipsByTargetId.get(personId) ?? [])];
}

export type AcademyEnrichedPersonRelationship = AcademyPersonRelationship & {
  sourcePerson: AcademyPerson | null;
  targetPerson: AcademyPerson | null;
};

function enrichRelationship(relationship: AcademyPersonRelationship): AcademyEnrichedPersonRelationship {
  const repository = getAcademyKnowledgeRepository();

  return {
    ...relationship,
    sourcePerson: repository.personsById.get(relationship.sourcePersonId) ?? null,
    targetPerson: repository.personsById.get(relationship.targetPersonId) ?? null,
  };
}

export function getEnrichedPersonRelationshipsFrom(personId: number): AcademyEnrichedPersonRelationship[] {
  return getPersonRelationshipsFrom(personId).map(enrichRelationship);
}

export function getEnrichedPersonRelationshipsTo(personId: number): AcademyEnrichedPersonRelationship[] {
  return getPersonRelationshipsTo(personId).map(enrichRelationship);
}

export function getRelatedPeopleForPerson(personId: number): AcademyPerson[] {
  const relationships = [...getPersonRelationshipsFrom(personId), ...getPersonRelationshipsTo(personId)];

  const repository = getAcademyKnowledgeRepository();
  const relatedPeople = relationships
    .map((relationship) => {
      if (relationship.sourcePersonId === personId) {
        return repository.personsById.get(relationship.targetPersonId) ?? null;
      }

      if (relationship.targetPersonId === personId) {
        return repository.personsById.get(relationship.sourcePersonId) ?? null;
      }

      return null;
    })
    .filter((person): person is AcademyPerson => person !== null);

  return uniqueById(relatedPeople).sort(byDisplayName);
}

export function getAllRelationshipTypes(): string[] {
  const repository = getAcademyKnowledgeRepository();
  return [...repository.personRelationshipsByType.keys()].sort((a, b) => a.localeCompare(b));
}
