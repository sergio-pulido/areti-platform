import type { AcademyPerson } from "@/lib/academy/knowledge-types";

export function formatHistoricalYear(year: number | null): string {
  if (typeof year !== "number") {
    return "Unknown";
  }

  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }

  return `${year} CE`;
}

export function formatLifespan(person: AcademyPerson): string {
  if (person.birthYear === null && person.deathYear === null) {
    return "Dates unknown";
  }

  if (person.birthYear !== null && person.deathYear === null) {
    return `${formatHistoricalYear(person.birthYear)} - present`;
  }

  if (person.birthYear === null && person.deathYear !== null) {
    return `Died ${formatHistoricalYear(person.deathYear)}`;
  }

  return `${formatHistoricalYear(person.birthYear)} - ${formatHistoricalYear(person.deathYear)}`;
}

export function formatRoleLabel(roleType: string | null): string {
  if (!roleType) {
    return "Thinker";
  }

  return roleType
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatRelationshipType(value: string): string {
  switch (value) {
    case "influenced_by":
      return "Influenced by";
    case "belongs_to_same_tradition":
      return "Shared tradition";
    default:
      return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}
