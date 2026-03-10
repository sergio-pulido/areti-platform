import { getAcademyKnowledgeRepository } from "@/lib/academy/knowledge-repository";
import { getAcademyPathBySlug, getAcademyPaths } from "@/lib/academy/knowledge-paths";
import { searchAcademy as runSearchAcademy } from "@/lib/academy/knowledge-search";
import {
  getAllConcepts,
  getAllDomains,
  getAllPersons,
  getAllRelationshipTypes,
  getAllTraditions,
  getAllWorks,
  getChildTraditions,
  getConceptBySlug,
  getConceptLinksBySlug,
  getDomainBySlug,
  getDomainForTradition,
  getEnrichedPersonRelationshipsFrom,
  getEnrichedPersonRelationshipsTo,
  getParentTradition,
  getPersonBySlug,
  getPersonForWork,
  getPersonsByDomain,
  getPersonsByTradition,
  getRelatedConceptsForPerson,
  getRelatedConceptsForTradition,
  getRelatedConceptsForWork,
  getRelatedPeopleForPerson,
  getRelatedTraditions,
  getRelatedWorks,
  getTraditionBySlug,
  getTraditionForPerson,
  getTraditionForWork,
  getTraditionsByDomain,
  getWorkBySlug,
  getWorksByPerson,
  getWorksByTradition,
} from "@/lib/academy/knowledge-selectors";
import type {
  AcademyConcept,
  AcademyDomain,
  AcademyPath,
  AcademyPerson,
  AcademySearchResult,
  AcademyTradition,
  AcademyWork,
} from "@/lib/academy/knowledge-types";

function rankTradition(tradition: AcademyTradition): number {
  const peopleCount = getPersonsByTradition(tradition.id).length;
  const worksCount = getWorksByTradition(tradition.id).length;
  return peopleCount * 2 + worksCount;
}

function personCredibilityRank(person: AcademyPerson): number {
  switch (person.credibilityBand) {
    case "foundational":
      return 1;
    case "major":
      return 2;
    case "secondary":
      return 3;
    case "popularizer":
      return 4;
    case "controversial":
      return 5;
    default:
      return 99;
  }
}

function rankPerson(person: AcademyPerson): number {
  const worksCount = getWorksByPerson(person.id).length;
  return personCredibilityRank(person) * 10 - worksCount;
}

export function getAcademyStats(): {
  domainCount: number;
  traditionCount: number;
  thinkerCount: number;
  workCount: number;
  conceptCount: number;
  relationshipCount: number;
} {
  const repository = getAcademyKnowledgeRepository();

  return {
    domainCount: repository.dataset.domains.length,
    traditionCount: repository.dataset.traditions.length,
    thinkerCount: repository.dataset.persons.length,
    workCount: repository.dataset.works.length,
    conceptCount: repository.dataset.concepts.length,
    relationshipCount: repository.dataset.personRelationships.length,
  };
}

export function getFeaturedTraditions(limit = 6): AcademyTradition[] {
  return getAllTraditions()
    .sort((a, b) => rankTradition(b) - rankTradition(a) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function getFeaturedThinkers(limit = 6): AcademyPerson[] {
  return getAllPersons()
    .sort((a, b) => rankPerson(a) - rankPerson(b) || a.displayName.localeCompare(b.displayName))
    .slice(0, limit);
}

export function getFeaturedConcepts(limit = 6): AcademyConcept[] {
  const concepts = getAllConcepts();

  return concepts
    .sort((a, b) => {
      const aWeight = getConceptLinksBySlug(a.slug).persons.length + getConceptLinksBySlug(a.slug).works.length;
      const bWeight = getConceptLinksBySlug(b.slug).persons.length + getConceptLinksBySlug(b.slug).works.length;
      return bWeight - aWeight || a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function getSearchPreview(limit = 8): AcademySearchResult[] {
  return runSearchAcademy("meaning", { limit });
}

export function getKnowledgeSnapshot() {
  return getAcademyKnowledgeRepository().dataset;
}

export function searchAcademy(query: string, limit = 40): AcademySearchResult[] {
  return runSearchAcademy(query, { limit });
}

export {
  getAllConcepts,
  getAllDomains,
  getAllPersons,
  getAllRelationshipTypes,
  getAllTraditions,
  getAllWorks,
  getChildTraditions,
  getConceptBySlug,
  getConceptLinksBySlug,
  getDomainBySlug,
  getDomainForTradition,
  getEnrichedPersonRelationshipsFrom,
  getEnrichedPersonRelationshipsTo,
  getParentTradition,
  getPersonBySlug,
  getPersonForWork,
  getPersonsByDomain,
  getPersonsByTradition,
  getRelatedConceptsForPerson,
  getRelatedConceptsForTradition,
  getRelatedConceptsForWork,
  getRelatedPeopleForPerson,
  getRelatedTraditions,
  getRelatedWorks,
  getTraditionBySlug,
  getTraditionForPerson,
  getTraditionForWork,
  getTraditionsByDomain,
  getWorkBySlug,
  getWorksByPerson,
  getWorksByTradition,
  getAcademyPaths,
  getAcademyPathBySlug,
};

export type {
  AcademyConcept,
  AcademyDomain,
  AcademyPath,
  AcademyPerson,
  AcademySearchResult,
  AcademyTradition,
  AcademyWork,
};
