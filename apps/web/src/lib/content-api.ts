export type LandingPillar = {
  id: number;
  slug: string;
  title: string;
  description: string;
};

export type LandingHighlight = {
  id: number;
  slug: string;
  description: string;
};

export type LibraryLesson = {
  id: number;
  slug: string;
  title: string;
  tradition: string;
  level: string;
  minutes: number;
  summary: string;
};

export type PracticeRoutine = {
  id: number;
  slug: string;
  title: string;
  description: string;
  cadence: string;
};

export type CommunityCircle = {
  id: number;
  slug: string;
  name: string;
  focus: string;
  schedule: string;
};

export type CommunityChallenge = {
  id: number;
  slug: string;
  title: string;
  duration: string;
  summary: string;
};

export type CommunityResource = {
  id: number;
  slug: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type CommunityExpert = {
  id: number;
  slug: string;
  name: string;
  focus: string;
};

export type CommunityEvent = {
  id: number;
  slug: string;
  title: string;
  schedule: string;
  summary: string;
};

export type CreatorVideo = {
  id: number;
  slug: string;
  title: string;
  format: string;
  summary: string;
  videoUrl: string;
};

export type LandingContent = {
  pillars: LandingPillar[];
  highlights: LandingHighlight[];
};

function getApiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:4000"
  );
}

async function getContent<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: T };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchLandingContent(): Promise<LandingContent> {
  return (
    (await getContent<LandingContent>("/api/v1/content/landing")) ?? {
      pillars: [],
      highlights: [],
    }
  );
}

export async function fetchLibraryLessons(query?: string): Promise<LibraryLesson[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : "";
  return (await getContent<LibraryLesson[]>(`/api/v1/content/library${qs}`)) ?? [];
}

export async function fetchPracticeRoutines(): Promise<PracticeRoutine[]> {
  return (await getContent<PracticeRoutine[]>("/api/v1/content/practices")) ?? [];
}

export async function fetchCommunityCircles(): Promise<CommunityCircle[]> {
  return (await getContent<CommunityCircle[]>("/api/v1/content/community")) ?? [];
}

export async function fetchCommunityChallenges(): Promise<CommunityChallenge[]> {
  return (await getContent<CommunityChallenge[]>("/api/v1/content/challenges")) ?? [];
}

export async function fetchCommunityResources(): Promise<CommunityResource[]> {
  return (await getContent<CommunityResource[]>("/api/v1/content/resources")) ?? [];
}

export async function fetchCommunityExperts(): Promise<CommunityExpert[]> {
  return (await getContent<CommunityExpert[]>("/api/v1/content/experts")) ?? [];
}

export async function fetchCommunityEvents(): Promise<CommunityEvent[]> {
  return (await getContent<CommunityEvent[]>("/api/v1/content/events")) ?? [];
}

export async function fetchCreatorVideos(): Promise<CreatorVideo[]> {
  return (await getContent<CreatorVideo[]>("/api/v1/content/videos")) ?? [];
}
