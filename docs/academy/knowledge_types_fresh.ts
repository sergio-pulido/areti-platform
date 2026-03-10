// Fresh TypeScript types file
export type Domain = {
  id: number;
  slug: string;
  name: string;
  description_short?: string | null;
};

export type Tradition = {
  id: number;
  domain_id: number;
  parent_tradition_id?: number | null;
  slug: string;
  name: string;
  origin_region?: string | null;
  description_short?: string | null;
};

export type Person = {
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

export type Work = {
  id: number;
  person_id?: number | null;
  tradition_id?: number | null;
  title: string;
  work_type?: string | null;
  publication_year?: number | null;
  is_primary_text?: boolean;
  summary_short?: string | null;
};

export type Concept = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  concept_family?: string | null;
};

export type PersonRelationship = {
  id: number;
  source_person_id: number;
  target_person_id: number;
  relationship_type: string;
  notes?: string | null;
};
