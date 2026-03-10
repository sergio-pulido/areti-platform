-- Fresh schema file
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description_short TEXT
);

CREATE TABLE IF NOT EXISTS traditions (
  id INTEGER PRIMARY KEY,
  domain_id INTEGER NOT NULL REFERENCES domains(id),
  parent_tradition_id INTEGER REFERENCES traditions(id),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  origin_region TEXT,
  description_short TEXT
);

CREATE TABLE IF NOT EXISTS persons (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  birth_year INTEGER,
  death_year INTEGER,
  country_or_region TEXT,
  tradition_id INTEGER REFERENCES traditions(id),
  role_type TEXT,
  is_founder BOOLEAN DEFAULT FALSE,
  credibility_band TEXT,
  bio_short TEXT,
  evidence_profile TEXT,
  claim_risk_level TEXT
);

CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id),
  tradition_id INTEGER REFERENCES traditions(id),
  title TEXT NOT NULL,
  work_type TEXT,
  publication_year INTEGER,
  is_primary_text BOOLEAN DEFAULT FALSE,
  summary_short TEXT
);

CREATE TABLE IF NOT EXISTS concepts (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  concept_family TEXT
);

CREATE TABLE IF NOT EXISTS person_relationships (
  id INTEGER PRIMARY KEY,
  source_person_id INTEGER NOT NULL REFERENCES persons(id),
  target_person_id INTEGER NOT NULL REFERENCES persons(id),
  relationship_type TEXT NOT NULL,
  notes TEXT
);
