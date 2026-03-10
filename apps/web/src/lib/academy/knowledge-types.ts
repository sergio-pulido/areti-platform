export type AcademyDomainSeed = {
  id: number;
  slug: string;
  name: string;
  description_short?: string | null;
};

export type AcademyTraditionSeed = {
  id: number;
  domain_id: number;
  parent_tradition_id?: number | null;
  slug: string;
  name: string;
  origin_region?: string | null;
  description_short?: string | null;
};

export type AcademyPersonSeed = {
  id: number;
  slug: string;
  display_name: string;
  birth_year?: number | null;
  death_year?: number | null;
  country_or_region?: string | null;
  tradition_id?: number | null;
  role_type?: string | null;
  is_founder?: boolean;
  credibility_band?: string | null;
  bio_short?: string | null;
  evidence_profile?: string | null;
  claim_risk_level?: string | null;
};

export type AcademyWorkSeed = {
  id: number;
  person_id?: number | null;
  tradition_id?: number | null;
  title: string;
  work_type?: string | null;
  publication_year?: number | null;
  is_primary_text?: boolean;
  summary_short?: string | null;
};

export type AcademyConceptSeed = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  concept_family?: string | null;
};

export type AcademyPersonRelationshipSeed = {
  id: number;
  source_person_id: number;
  target_person_id: number;
  relationship_type: string;
  notes?: string | null;
};

export type AcademyKnowledgeSeed = {
  domains: AcademyDomainSeed[];
  traditions: AcademyTraditionSeed[];
  persons: AcademyPersonSeed[];
  works: AcademyWorkSeed[];
  concepts: AcademyConceptSeed[];
  person_relationships: AcademyPersonRelationshipSeed[];
};

export type AcademyDomain = {
  id: number;
  slug: string;
  name: string;
  descriptionShort: string | null;
};

export type AcademyTradition = {
  id: number;
  domainId: number;
  parentTraditionId: number | null;
  slug: string;
  name: string;
  originRegion: string | null;
  descriptionShort: string | null;
};

export type AcademyPerson = {
  id: number;
  slug: string;
  displayName: string;
  birthYear: number | null;
  deathYear: number | null;
  countryOrRegion: string | null;
  traditionId: number | null;
  roleType: string | null;
  isFounder: boolean;
  credibilityBand: string | null;
  bioShort: string | null;
  evidenceProfile: string | null;
  claimRiskLevel: string | null;
};

export type AcademyWork = {
  id: number;
  slug: string;
  personId: number | null;
  traditionId: number | null;
  title: string;
  workType: string | null;
  publicationYear: number | null;
  isPrimaryText: boolean;
  summaryShort: string | null;
};

export type AcademyConcept = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  conceptFamily: string | null;
};

export type AcademyPersonRelationship = {
  id: number;
  sourcePersonId: number;
  targetPersonId: number;
  relationshipType: string;
  notes: string | null;
};

export type AcademyKnowledgeDataset = {
  domains: AcademyDomain[];
  traditions: AcademyTradition[];
  persons: AcademyPerson[];
  works: AcademyWork[];
  concepts: AcademyConcept[];
  personRelationships: AcademyPersonRelationship[];
};

export type AcademySearchResultType = "domain" | "tradition" | "thinker" | "work" | "concept";

export type AcademySearchResult = {
  type: AcademySearchResultType;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  href: string;
  score: number;
  tags: string[];
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
  traditionSlugs: string[];
  personSlugs: string[];
  workIds: number[];
  conceptSlugs: string[];
};

export type AcademyPath = {
  slug: string;
  title: string;
  summary: string;
  tone: "beginner" | "intermediate";
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  progressionOrder: number;
  recommendationWeight: number;
  recommendationHint: string;
  isFeatured: boolean;
  traditions: AcademyTradition[];
  persons: AcademyPerson[];
  works: AcademyWork[];
  concepts: AcademyConcept[];
};

export type AcademyConceptLinkSeed = {
  traditionSlugs: string[];
  personSlugs: string[];
  workIds: number[];
};

export type AcademyConceptLinks = {
  traditions: AcademyTradition[];
  persons: AcademyPerson[];
  works: AcademyWork[];
};
