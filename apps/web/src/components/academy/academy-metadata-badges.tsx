import { Badge } from "@/components/ui/badge";

type CredibilityBand = string | null;
type ClaimRiskLevel = string | null;

function normalizeBand(value: CredibilityBand): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeRisk(value: ClaimRiskLevel): string {
  return (value ?? "").trim().toLowerCase();
}

export function credibilityBandLabel(value: CredibilityBand): string {
  switch (normalizeBand(value)) {
    case "foundational":
      return "Foundational";
    case "major":
      return "Major";
    case "secondary":
      return "Secondary";
    case "popularizer":
      return "Popularizer";
    case "controversial":
      return "Controversial";
    default:
      return "Unclassified";
  }
}

export function CredibilityBadge({ value }: { value: CredibilityBand }) {
  const normalized = normalizeBand(value);

  if (!normalized) {
    return <Badge variant="muted">Unclassified</Badge>;
  }

  if (normalized === "foundational") {
    return <Badge variant="success">Foundational</Badge>;
  }

  if (normalized === "major") {
    return <Badge variant="default">Major</Badge>;
  }

  if (normalized === "secondary") {
    return <Badge variant="muted">Secondary</Badge>;
  }

  if (normalized === "popularizer") {
    return (
      <Badge variant="default" className="border-sky-300/35 bg-sky-500/10 text-sky-100">
        Popularizer
      </Badge>
    );
  }

  if (normalized === "controversial") {
    return (
      <Badge variant="default" className="border-amber-300/45 bg-amber-500/12 text-amber-100">
        Controversial
      </Badge>
    );
  }

  return <Badge variant="muted">{credibilityBandLabel(value)}</Badge>;
}

export function EvidenceBadge({ value }: { value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <Badge variant="muted" className="border-night-600/80">
      Evidence: {value}
    </Badge>
  );
}

export function ClaimRiskBadge({ value }: { value: ClaimRiskLevel }) {
  const normalized = normalizeRisk(value);

  if (!normalized) {
    return null;
  }

  if (normalized === "high") {
    return (
      <Badge variant="default" className="border-rose-300/45 bg-rose-500/14 text-rose-100">
        Claim risk: High
      </Badge>
    );
  }

  if (normalized === "medium") {
    return (
      <Badge variant="default" className="border-amber-300/45 bg-amber-500/10 text-amber-100">
        Claim risk: Medium
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="border-sage-300/35 bg-sage-500/12 text-sage-100">
      Claim risk: Low
    </Badge>
  );
}

export function WorkAuthorityBadge({ isPrimaryText }: { isPrimaryText: boolean }) {
  if (isPrimaryText) {
    return <Badge variant="success">Primary text</Badge>;
  }

  return <Badge variant="muted">Secondary text</Badge>;
}
