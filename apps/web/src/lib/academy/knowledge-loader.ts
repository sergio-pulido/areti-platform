import knowledgeSeedData from "@/lib/academy/knowledge-seed.json";
import type { AcademyKnowledgeSeed } from "@/lib/academy/knowledge-types";

function assertKnowledgeSeed(seed: Partial<AcademyKnowledgeSeed>): asserts seed is AcademyKnowledgeSeed {
  if (!Array.isArray(seed.domains)) {
    throw new Error("Academy seed is missing domains.");
  }

  if (!Array.isArray(seed.traditions)) {
    throw new Error("Academy seed is missing traditions.");
  }

  if (!Array.isArray(seed.persons)) {
    throw new Error("Academy seed is missing persons.");
  }

  if (!Array.isArray(seed.works)) {
    throw new Error("Academy seed is missing works.");
  }

  if (!Array.isArray(seed.concepts)) {
    throw new Error("Academy seed is missing concepts.");
  }

  if (!Array.isArray(seed.person_relationships)) {
    throw new Error("Academy seed is missing person relationships.");
  }
}

export function loadAcademyKnowledgeSeed(): AcademyKnowledgeSeed {
  const seed = knowledgeSeedData as Partial<AcademyKnowledgeSeed>;
  assertKnowledgeSeed(seed);
  return seed;
}
