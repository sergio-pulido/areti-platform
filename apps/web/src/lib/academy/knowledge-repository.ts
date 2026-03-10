import { loadAcademyKnowledgeSeed } from "@/lib/academy/knowledge-loader";
import type {
  AcademyConcept,
  AcademyDomain,
  AcademyKnowledgeDataset,
  AcademyKnowledgeSeed,
  AcademyPerson,
  AcademyPersonRelationship,
  AcademyTradition,
  AcademyWork,
} from "@/lib/academy/knowledge-types";

type NumericEntity = { id: number };

type SlugEntity = { slug: string };

type GroupedByNumber<T> = Map<number, T[]>;

type GroupedByString<T> = Map<string, T[]>;

export type AcademyKnowledgeRepository = {
  dataset: AcademyKnowledgeDataset;
  domainsById: Map<number, AcademyDomain>;
  domainsBySlug: Map<string, AcademyDomain>;
  traditionsById: Map<number, AcademyTradition>;
  traditionsBySlug: Map<string, AcademyTradition>;
  traditionsByDomainId: GroupedByNumber<AcademyTradition>;
  childTraditionsByParentId: GroupedByNumber<AcademyTradition>;
  personsById: Map<number, AcademyPerson>;
  personsBySlug: Map<string, AcademyPerson>;
  personsByTraditionId: GroupedByNumber<AcademyPerson>;
  worksById: Map<number, AcademyWork>;
  worksBySlug: Map<string, AcademyWork>;
  worksByPersonId: GroupedByNumber<AcademyWork>;
  worksByTraditionId: GroupedByNumber<AcademyWork>;
  conceptsById: Map<number, AcademyConcept>;
  conceptsBySlug: Map<string, AcademyConcept>;
  personRelationshipsBySourceId: GroupedByNumber<AcademyPersonRelationship>;
  personRelationshipsByTargetId: GroupedByNumber<AcademyPersonRelationship>;
  personRelationshipsByType: GroupedByString<AcademyPersonRelationship>;
};

let repositoryCache: AcademyKnowledgeRepository | null = null;

function toNullableString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: number | null | undefined): number | null {
  return typeof value === "number" ? value : null;
}

function createNumericMap<T extends NumericEntity>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function createSlugMap<T extends SlugEntity>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.slug, item]));
}

function addGroupedItem<T>(group: Map<number, T[]>, key: number | null, item: T): void {
  if (key === null) {
    return;
  }

  const existing = group.get(key) ?? [];
  existing.push(item);
  group.set(key, existing);
}

function addGroupedItemByString<T>(group: Map<string, T[]>, key: string, item: T): void {
  const existing = group.get(key) ?? [];
  existing.push(item);
  group.set(key, existing);
}

function createEntitySlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
}

export function createWorkSlug(title: string, id: number): string {
  return `${createEntitySlug(title)}-${id}`;
}

function normalizeSeed(seed: AcademyKnowledgeSeed): AcademyKnowledgeDataset {
  const domains: AcademyDomain[] = seed.domains.map((domain) => ({
    id: domain.id,
    slug: domain.slug,
    name: domain.name,
    descriptionShort: toNullableString(domain.description_short),
  }));

  const traditions: AcademyTradition[] = seed.traditions.map((tradition) => ({
    id: tradition.id,
    domainId: tradition.domain_id,
    parentTraditionId: toNullableNumber(tradition.parent_tradition_id),
    slug: tradition.slug,
    name: tradition.name,
    originRegion: toNullableString(tradition.origin_region),
    descriptionShort: toNullableString(tradition.description_short),
  }));

  const persons: AcademyPerson[] = seed.persons.map((person) => ({
    id: person.id,
    slug: person.slug,
    displayName: person.display_name,
    birthYear: toNullableNumber(person.birth_year),
    deathYear: toNullableNumber(person.death_year),
    countryOrRegion: toNullableString(person.country_or_region),
    traditionId: toNullableNumber(person.tradition_id),
    roleType: toNullableString(person.role_type),
    isFounder: person.is_founder === true,
    credibilityBand: toNullableString(person.credibility_band),
    bioShort: toNullableString(person.bio_short),
    evidenceProfile: toNullableString(person.evidence_profile),
    claimRiskLevel: toNullableString(person.claim_risk_level),
  }));

  const works: AcademyWork[] = seed.works.map((work) => ({
    id: work.id,
    slug: createWorkSlug(work.title, work.id),
    personId: toNullableNumber(work.person_id),
    traditionId: toNullableNumber(work.tradition_id),
    title: work.title,
    workType: toNullableString(work.work_type),
    publicationYear: toNullableNumber(work.publication_year),
    isPrimaryText: work.is_primary_text === true,
    summaryShort: toNullableString(work.summary_short),
  }));

  const concepts: AcademyConcept[] = seed.concepts.map((concept) => ({
    id: concept.id,
    slug: concept.slug,
    name: concept.name,
    description: toNullableString(concept.description),
    conceptFamily: toNullableString(concept.concept_family),
  }));

  const personRelationships: AcademyPersonRelationship[] = seed.person_relationships.map((relationship) => ({
    id: relationship.id,
    sourcePersonId: relationship.source_person_id,
    targetPersonId: relationship.target_person_id,
    relationshipType: relationship.relationship_type,
    notes: toNullableString(relationship.notes),
  }));

  return {
    domains,
    traditions,
    persons,
    works,
    concepts,
    personRelationships,
  };
}

function createRepository(dataset: AcademyKnowledgeDataset): AcademyKnowledgeRepository {
  const traditionsByDomainId: GroupedByNumber<AcademyTradition> = new Map();
  const childTraditionsByParentId: GroupedByNumber<AcademyTradition> = new Map();
  const personsByTraditionId: GroupedByNumber<AcademyPerson> = new Map();
  const worksByPersonId: GroupedByNumber<AcademyWork> = new Map();
  const worksByTraditionId: GroupedByNumber<AcademyWork> = new Map();
  const personRelationshipsBySourceId: GroupedByNumber<AcademyPersonRelationship> = new Map();
  const personRelationshipsByTargetId: GroupedByNumber<AcademyPersonRelationship> = new Map();
  const personRelationshipsByType: GroupedByString<AcademyPersonRelationship> = new Map();

  for (const tradition of dataset.traditions) {
    addGroupedItem(traditionsByDomainId, tradition.domainId, tradition);
    addGroupedItem(childTraditionsByParentId, tradition.parentTraditionId, tradition);
  }

  for (const person of dataset.persons) {
    addGroupedItem(personsByTraditionId, person.traditionId, person);
  }

  for (const work of dataset.works) {
    addGroupedItem(worksByPersonId, work.personId, work);
    addGroupedItem(worksByTraditionId, work.traditionId, work);
  }

  for (const relationship of dataset.personRelationships) {
    addGroupedItem(personRelationshipsBySourceId, relationship.sourcePersonId, relationship);
    addGroupedItem(personRelationshipsByTargetId, relationship.targetPersonId, relationship);
    addGroupedItemByString(personRelationshipsByType, relationship.relationshipType, relationship);
  }

  return {
    dataset,
    domainsById: createNumericMap(dataset.domains),
    domainsBySlug: createSlugMap(dataset.domains),
    traditionsById: createNumericMap(dataset.traditions),
    traditionsBySlug: createSlugMap(dataset.traditions),
    traditionsByDomainId,
    childTraditionsByParentId,
    personsById: createNumericMap(dataset.persons),
    personsBySlug: createSlugMap(dataset.persons),
    personsByTraditionId,
    worksById: createNumericMap(dataset.works),
    worksBySlug: createSlugMap(dataset.works),
    worksByPersonId,
    worksByTraditionId,
    conceptsById: createNumericMap(dataset.concepts),
    conceptsBySlug: createSlugMap(dataset.concepts),
    personRelationshipsBySourceId,
    personRelationshipsByTargetId,
    personRelationshipsByType,
  };
}

export function getAcademyKnowledgeRepository(): AcademyKnowledgeRepository {
  if (repositoryCache) {
    return repositoryCache;
  }

  const seed = loadAcademyKnowledgeSeed();
  const dataset = normalizeSeed(seed);
  repositoryCache = createRepository(dataset);
  return repositoryCache;
}
