// Fresh Drizzle schema file
import { pgTable, integer, text, boolean } from "drizzle-orm/pg-core";

export const domains = pgTable("domains", {
  id: integer("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  descriptionShort: text("description_short"),
});

export const traditions = pgTable("traditions", {
  id: integer("id").primaryKey(),
  domainId: integer("domain_id").notNull(),
  parentTraditionId: integer("parent_tradition_id"),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  originRegion: text("origin_region"),
  descriptionShort: text("description_short"),
});

export const persons = pgTable("persons", {
  id: integer("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  birthYear: integer("birth_year"),
  deathYear: integer("death_year"),
  countryOrRegion: text("country_or_region"),
  traditionId: integer("tradition_id"),
  roleType: text("role_type"),
  isFounder: boolean("is_founder").default(false),
  credibilityBand: text("credibility_band"),
  bioShort: text("bio_short"),
  evidenceProfile: text("evidence_profile"),
  claimRiskLevel: text("claim_risk_level"),
});

export const works = pgTable("works", {
  id: integer("id").primaryKey(),
  personId: integer("person_id"),
  traditionId: integer("tradition_id"),
  title: text("title").notNull(),
  workType: text("work_type"),
  publicationYear: integer("publication_year"),
  isPrimaryText: boolean("is_primary_text").default(false),
  summaryShort: text("summary_short"),
});

export const concepts = pgTable("concepts", {
  id: integer("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  conceptFamily: text("concept_family"),
});

export const personRelationships = pgTable("person_relationships", {
  id: integer("id").primaryKey(),
  sourcePersonId: integer("source_person_id").notNull(),
  targetPersonId: integer("target_person_id").notNull(),
  relationshipType: text("relationship_type").notNull(),
  notes: text("notes"),
});
