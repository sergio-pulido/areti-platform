import {
  Bell,
  BookOpen,
  Bot,
  AudioLines,
  CalendarDays,
  Clapperboard,
  CreditCard,
  FileCog,
  Compass,
  FlaskConical,
  FolderKanban,
  Home,
  Notebook,
  NotebookPen,
  Search,
  Settings,
  Shield,
  Trophy,
  UserRound,
  UsersRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "user" | "admin";

export type NavSectionId =
  | "landing"
  | "personal"
  | "academy"
  | "companion"
  | "community"
  | "creator"
  | "admin"
  | "account";

export type NavSectionAccess = "public" | "authenticated" | "admin";
export type NavSectionGroup = "public" | "product" | "account" | "admin";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  group?: string;
  matchSubpaths?: boolean;
  enabled?: boolean;
};

type NavRouteMatcher = {
  exact?: readonly string[];
  prefixes?: readonly string[];
};

export type NavSection = {
  id: NavSectionId;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  group: NavSectionGroup;
  access: NavSectionAccess;
  match: NavRouteMatcher;
  desktopItems: NavItem[];
  mobilePrimaryItems: NavItem[];
  mobileSecondaryItems?: NavItem[];
};

export type MobileNavSectionGroup = {
  id: Exclude<NavSectionGroup, "public">;
  label: string;
  sections: NavSection[];
};

export type MobileNavigationContext = {
  activeSection: NavSection;
  switcherGroups: MobileNavSectionGroup[];
  contextualPrimaryItems: NavItem[];
  contextualSecondaryItems: NavItem[];
  activeContextualHref: string | null;
  utilityItems: NavItem[];
};

function navItem(input: {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  matchSubpaths?: boolean;
  enabled?: boolean;
}): NavItem {
  return {
    id: input.id,
    href: input.href,
    label: input.label,
    icon: input.icon,
    description: input.description,
    matchSubpaths: input.matchSubpaths,
    enabled: input.enabled,
  };
}

const navSections: NavSection[] = [
  {
    id: "landing",
    label: "Home",
    href: "/",
    icon: Home,
    description: "Public pages and onboarding entry",
    group: "public",
    access: "public",
    match: {
      exact: ["/"],
      prefixes: ["/auth", "/legal", "/preview", "/offline", "/onboarding"],
    },
    desktopItems: [],
    mobilePrimaryItems: [],
  },
  {
    id: "personal",
    label: "Personal",
    href: "/dashboard",
    icon: Home,
    description: "Solo work and self-development",
    group: "product",
    access: "authenticated",
    match: {
      prefixes: ["/dashboard", "/library", "/practices", "/journal", "/reflections"],
    },
    desktopItems: [
      navItem({
        id: "personal-overview",
        href: "/dashboard",
        label: "Overview",
        icon: Home,
        description: "Pulse and priorities",
        matchSubpaths: false,
      }),
      navItem({
        id: "personal-library",
        href: "/library",
        label: "Library",
        icon: BookOpen,
        description: "Curated readings",
      }),
      navItem({
        id: "personal-practices",
        href: "/practices",
        label: "Practices",
        icon: Compass,
        description: "Daily exercises",
      }),
      navItem({
        id: "personal-journal",
        href: "/journal",
        label: "Journal",
        icon: Notebook,
        description: "Reflections and mood",
      }),
      navItem({
        id: "personal-reflections",
        href: "/reflections",
        label: "Reflections",
        icon: AudioLines,
        description: "Voice and AI clarity",
      }),
    ],
    mobilePrimaryItems: [
      navItem({
        id: "personal-mobile-overview",
        href: "/dashboard",
        label: "Overview",
        icon: Home,
        description: "Pulse and priorities",
        matchSubpaths: false,
      }),
      navItem({
        id: "personal-mobile-journal",
        href: "/journal",
        label: "Journal",
        icon: Notebook,
        description: "Capture reflections",
      }),
      navItem({
        id: "personal-mobile-reflections",
        href: "/reflections",
        label: "Reflections",
        icon: AudioLines,
        description: "Review voice and AI notes",
      }),
      navItem({
        id: "personal-mobile-practices",
        href: "/practices",
        label: "Practices",
        icon: Compass,
        description: "Run daily exercises",
      }),
    ],
    mobileSecondaryItems: [
      navItem({
        id: "personal-mobile-library",
        href: "/library",
        label: "Library",
        icon: BookOpen,
        description: "Browse readings",
      }),
    ],
  },
  {
    id: "academy",
    label: "Academy",
    href: "/academy",
    icon: BookOpen,
    description: "Structured traditions, thinkers, works, and concepts",
    group: "product",
    access: "authenticated",
    match: {
      prefixes: ["/academy"],
    },
    desktopItems: [
      navItem({
        id: "academy-overview",
        href: "/academy",
        label: "Overview",
        icon: BookOpen,
        description: "Knowledge foundation",
        matchSubpaths: false,
      }),
      navItem({
        id: "academy-traditions",
        href: "/academy/traditions",
        label: "Traditions",
        icon: Compass,
        description: "Schools and lineages",
      }),
      navItem({
        id: "academy-thinkers",
        href: "/academy/thinkers",
        label: "Thinkers",
        icon: UsersRound,
        description: "Authors and teachers",
      }),
      navItem({
        id: "academy-works",
        href: "/academy/works",
        label: "Works",
        icon: NotebookPen,
        description: "Primary and secondary texts",
      }),
      navItem({
        id: "academy-concepts",
        href: "/academy/concepts",
        label: "Concepts",
        icon: FlaskConical,
        description: "Core ideas and vocabulary",
      }),
      navItem({
        id: "academy-paths",
        href: "/academy/paths",
        label: "Paths",
        icon: Trophy,
        description: "Guided starter journeys",
      }),
      navItem({
        id: "academy-search",
        href: "/academy/search",
        label: "Search",
        icon: Search,
        description: "Cross-entity knowledge search",
      }),
    ],
    mobilePrimaryItems: [
      navItem({
        id: "academy-mobile-overview",
        href: "/academy",
        label: "Academy",
        icon: BookOpen,
        description: "Knowledge home",
        matchSubpaths: false,
      }),
      navItem({
        id: "academy-mobile-paths",
        href: "/academy/paths",
        label: "Paths",
        icon: Trophy,
        description: "Guided journeys",
      }),
      navItem({
        id: "academy-mobile-saved",
        href: "/academy/saved",
        label: "Saved",
        icon: FolderKanban,
        description: "Bookmarked content",
      }),
    ],
    mobileSecondaryItems: [
      navItem({
        id: "academy-mobile-search",
        href: "/academy/search",
        label: "Search",
        icon: Search,
        description: "Find lessons and concepts",
      }),
    ],
  },
  {
    id: "companion",
    label: "Companion",
    href: "/chat",
    icon: Bot,
    description: "Threaded AI conversations",
    group: "product",
    access: "authenticated",
    match: {
      prefixes: ["/chat"],
    },
    desktopItems: [
      navItem({
        id: "companion-conversations",
        href: "/chat",
        label: "Conversations",
        icon: Bot,
        description: "Socratic AI workspace",
      }),
    ],
    mobilePrimaryItems: [
      navItem({
        id: "companion-mobile-threads",
        href: "/chat",
        label: "Threads",
        icon: Bot,
        description: "Open conversation list",
        matchSubpaths: false,
      }),
      navItem({
        id: "companion-mobile-new",
        href: "/chat/new",
        label: "New chat",
        icon: NotebookPen,
        description: "Start a fresh conversation",
      }),
    ],
  },
  {
    id: "community",
    label: "Community",
    href: "/community",
    icon: Users,
    description: "Collaborative growth and groups",
    group: "product",
    access: "authenticated",
    match: {
      prefixes: ["/community"],
    },
    desktopItems: [
      navItem({
        id: "community-circles",
        href: "/community",
        label: "Circles",
        icon: Users,
        description: "Guided circles",
        matchSubpaths: false,
      }),
      navItem({
        id: "community-challenges",
        href: "/community/challenges",
        label: "Challenges",
        icon: Trophy,
        description: "Shared goals",
      }),
      navItem({
        id: "community-resources",
        href: "/community/resources",
        label: "Resources",
        icon: FolderKanban,
        description: "Community assets",
      }),
      navItem({
        id: "community-experts",
        href: "/community/experts",
        label: "Experts",
        icon: UsersRound,
        description: "Mentors and coaches",
      }),
      navItem({
        id: "community-events",
        href: "/community/events",
        label: "Events",
        icon: CalendarDays,
        description: "Live sessions",
      }),
    ],
    mobilePrimaryItems: [
      navItem({
        id: "community-mobile-overview",
        href: "/community",
        label: "Community",
        icon: Users,
        description: "Circles and peers",
        matchSubpaths: false,
      }),
      navItem({
        id: "community-mobile-challenges",
        href: "/community/challenges",
        label: "Challenges",
        icon: Trophy,
        description: "Shared goals",
      }),
      navItem({
        id: "community-mobile-events",
        href: "/community/events",
        label: "Events",
        icon: CalendarDays,
        description: "Live sessions",
      }),
    ],
  },
  {
    id: "creator",
    label: "Creator",
    href: "/creator",
    icon: FileCog,
    description: "Publish content for members",
    group: "admin",
    access: "admin",
    match: {
      prefixes: ["/creator"],
    },
    desktopItems: [
      navItem({
        id: "creator-cms",
        href: "/creator/cms",
        label: "CMS",
        icon: FileCog,
        description: "Content operations",
      }),
      navItem({
        id: "creator-exercises",
        href: "/creator/exercises",
        label: "Exercises",
        icon: FlaskConical,
        description: "Practice templates",
      }),
      navItem({
        id: "creator-readings",
        href: "/creator/readings",
        label: "Readings",
        icon: NotebookPen,
        description: "Written content",
      }),
      navItem({
        id: "creator-videos",
        href: "/creator/videos",
        label: "Videos",
        icon: Clapperboard,
        description: "Media publishing",
      }),
    ],
    mobilePrimaryItems: [
      navItem({
        id: "creator-mobile-cms",
        href: "/creator/cms",
        label: "CMS",
        icon: FileCog,
        description: "Content operations",
      }),
      navItem({
        id: "creator-mobile-readings",
        href: "/creator/readings",
        label: "Readings",
        icon: NotebookPen,
        description: "Written content",
      }),
      navItem({
        id: "creator-mobile-videos",
        href: "/creator/videos",
        label: "Videos",
        icon: Clapperboard,
        description: "Media publishing",
      }),
    ],
    mobileSecondaryItems: [
      navItem({
        id: "creator-mobile-exercises",
        href: "/creator/exercises",
        label: "Exercises",
        icon: FlaskConical,
        description: "Practice templates",
      }),
    ],
  },
  {
    id: "admin",
    label: "Admin",
    href: "/admin",
    icon: Shield,
    description: "Private operations and access controls",
    group: "admin",
    access: "admin",
    match: {
      prefixes: ["/admin"],
    },
    desktopItems: [
      navItem({
        id: "admin-users",
        href: "/admin/users",
        label: "Users",
        icon: Users,
        description: "Account inventory and roles",
      }),
      navItem({
        id: "admin-invitations",
        href: "/admin/invitations",
        label: "Invitations",
        icon: UsersRound,
        description: "Issue and revoke invite tokens",
      }),
      navItem({
        id: "admin-roles",
        href: "/admin/roles",
        label: "Roles",
        icon: Shield,
        description: "Role policy controls",
      }),
      navItem({
        id: "admin-plans",
        href: "/admin/plans",
        label: "Plans",
        icon: Trophy,
        description: "Plan catalog and access mapping",
      }),
      navItem({
        id: "admin-billing",
        href: "/admin/billing",
        label: "Billing",
        icon: CreditCard,
        description: "Billing operations and status",
      }),
      navItem({
        id: "admin-settings",
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
        description: "Admin workspace configuration",
      }),
      navItem({
        id: "admin-audit",
        href: "/admin/audit",
        label: "Audit",
        icon: Bell,
        description: "Operational audit timeline",
      }),
    ],
    mobilePrimaryItems: [
      navItem({
        id: "admin-mobile-users",
        href: "/admin/users",
        label: "Users",
        icon: Users,
        description: "Directory and status",
      }),
      navItem({
        id: "admin-mobile-invites",
        href: "/admin/invitations",
        label: "Invites",
        icon: UsersRound,
        description: "Issue invite links",
      }),
      navItem({
        id: "admin-mobile-audit",
        href: "/admin/audit",
        label: "Audit",
        icon: Bell,
        description: "Review admin activity",
      }),
    ],
    mobileSecondaryItems: [
      navItem({
        id: "admin-mobile-roles",
        href: "/admin/roles",
        label: "Roles",
        icon: Shield,
        description: "Access controls",
      }),
    ],
  },
  {
    id: "account",
    label: "Account",
    href: "/account/profile",
    icon: UserRound,
    description: "Profile, security, and personal controls",
    group: "account",
    access: "authenticated",
    match: {
      prefixes: ["/account"],
    },
    desktopItems: [
      navItem({
        id: "account-profile",
        href: "/account/profile",
        label: "Profile",
        icon: UserRound,
        description: "Personal identity and contact details",
        matchSubpaths: false,
      }),
      navItem({
        id: "account-preferences",
        href: "/account/preferences",
        label: "Preferences",
        icon: Settings,
        description: "Language and app experience settings",
      }),
      navItem({
        id: "account-notifications",
        href: "/account/notifications",
        label: "Notifications",
        icon: Bell,
        description: "Communication and reminder preferences",
      }),
      navItem({
        id: "account-security",
        href: "/account/security",
        label: "Security",
        icon: Shield,
        description: "Password, login methods, and active sessions",
      }),
      navItem({
        id: "account-subscription",
        href: "/account/subscription",
        label: "Subscription",
        icon: CreditCard,
        description: "Plan and payment relationship",
      }),
      navItem({
        id: "account-privacy",
        href: "/account/privacy",
        label: "Privacy",
        icon: Shield,
        description: "Data controls and account lifecycle",
      }),
    ],
    mobilePrimaryItems: [
      navItem({
        id: "account-mobile-profile",
        href: "/account/profile",
        label: "Profile",
        icon: UserRound,
        description: "Identity and contact",
        matchSubpaths: false,
      }),
      navItem({
        id: "account-mobile-preferences",
        href: "/account/preferences",
        label: "Preferences",
        icon: Settings,
        description: "Experience defaults",
      }),
      navItem({
        id: "account-mobile-security",
        href: "/account/security",
        label: "Security",
        icon: Shield,
        description: "Passwords and sessions",
      }),
      navItem({
        id: "account-mobile-subscription",
        href: "/account/subscription",
        label: "Subscription",
        icon: CreditCard,
        description: "Plan and billing",
      }),
    ],
    mobileSecondaryItems: [
      navItem({
        id: "account-mobile-notifications",
        href: "/account/notifications",
        label: "Notifications",
        icon: Bell,
        description: "Email and reminder settings",
      }),
      navItem({
        id: "account-mobile-privacy",
        href: "/account/privacy",
        label: "Privacy",
        icon: Shield,
        description: "Data and account lifecycle",
      }),
    ],
  },
];

const sectionById = new Map<NavSectionId, NavSection>(navSections.map((section) => [section.id, section]));

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const withPrefix = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;

  if (withPrefix.length > 1 && withPrefix.endsWith("/")) {
    return withPrefix.slice(0, -1);
  }

  return withPrefix;
}

function scoreSectionMatch(pathname: string, section: NavSection): number {
  let score = -1;

  for (const exact of section.match.exact ?? []) {
    if (pathname === exact) {
      score = Math.max(score, 2000 + exact.length);
    }
  }

  for (const prefix of section.match.prefixes ?? []) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      score = Math.max(score, 1000 + prefix.length);
    }
  }

  return score;
}

function canAccessSection(section: NavSection, role: UserRole | null, isAuthenticated = true): boolean {
  if (section.access === "public") {
    return true;
  }

  if (!isAuthenticated || !role) {
    return false;
  }

  if (section.access === "admin") {
    return role === "admin";
  }

  return true;
}

function fallbackSectionForPathname(pathname: string): NavSection {
  const normalized = normalizePathname(pathname);

  if (normalized === "/" || normalized.startsWith("/auth") || normalized.startsWith("/preview") || normalized.startsWith("/legal") || normalized.startsWith("/offline")) {
    return sectionById.get("landing") ?? navSections[0];
  }

  return sectionById.get("personal") ?? navSections[0];
}

function matchSectionForPathname(pathname: string): NavSection {
  const normalized = normalizePathname(pathname);
  let currentMatch: NavSection | null = null;
  let currentScore = -1;

  for (const section of navSections) {
    const nextScore = scoreSectionMatch(normalized, section);

    if (nextScore > currentScore) {
      currentMatch = section;
      currentScore = nextScore;
    }
  }

  return currentMatch ?? fallbackSectionForPathname(normalized);
}

function sectionOrPersonal(section: NavSection): NavSection {
  if (section.id === "landing") {
    return sectionById.get("personal") ?? section;
  }

  return section;
}

function selectSectionForRole(pathname: string, role: UserRole): NavSection {
  const matched = sectionOrPersonal(matchSectionForPathname(pathname));

  if (canAccessSection(matched, role, true)) {
    return matched;
  }

  return sectionById.get("personal") ?? matched;
}

function getActiveContextualHref(pathname: string, items: NavItem[]): string | null {
  const normalized = normalizePathname(pathname);
  const matched = items.find((item) => isNavItemActive(normalized, item));

  if (matched) {
    return matched.href;
  }

  return items[0]?.href ?? null;
}

export const dashboardNavSections: NavSection[] = navSections.filter((section) => section.id !== "landing");
export const dashboardNavItems: NavItem[] = dashboardNavSections.flatMap((section) => section.desktopItems);
export const topbarSections: NavSection[] = dashboardNavSections.filter((section) => section.id !== "account");

export function canAccessCreator(role: UserRole): boolean {
  return role === "admin";
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function getTopbarSectionsForRole(role: UserRole): NavSection[] {
  return topbarSections.filter((section) => canAccessSection(section, role));
}

export function getAccessibleNavSections(role: UserRole): NavSection[] {
  return dashboardNavSections.filter((section) => canAccessSection(section, role));
}

export function getNavSectionById(sectionId: string): NavSection {
  const matched = sectionById.get(sectionId as NavSectionId);

  if (matched) {
    return sectionOrPersonal(matched);
  }

  return sectionById.get("personal") ?? navSections[0];
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  const normalized = normalizePathname(pathname);

  if (normalized === item.href) {
    return true;
  }

  if (item.matchSubpaths === false) {
    return false;
  }

  return normalized.startsWith(`${item.href}/`);
}

export function getNavSectionForPathname(pathname: string): NavSection {
  return sectionOrPersonal(matchSectionForPathname(pathname));
}

export function getActiveNavSectionForRole(pathname: string, role: UserRole): NavSection {
  return selectSectionForRole(pathname, role);
}

function buildMobileSwitcherGroups(role: UserRole): MobileNavSectionGroup[] {
  const accessibleSections = getAccessibleNavSections(role);

  const groups: MobileNavSectionGroup[] = [
    {
      id: "product",
      label: "Product",
      sections: accessibleSections.filter((section) => section.group === "product"),
    },
    {
      id: "account",
      label: "Account",
      sections: accessibleSections.filter((section) => section.group === "account"),
    },
  ];

  const adminSections = accessibleSections.filter((section) => section.group === "admin");

  if (adminSections.length > 0) {
    groups.push({
      id: "admin",
      label: "Admin",
      sections: adminSections,
    });
  }

  return groups.filter((group) => group.sections.length > 0);
}

function buildUtilityItems(activeSection: NavSection, role: UserRole): NavItem[] {
  const utilityItems: NavItem[] = [];

  if (activeSection.id !== "account") {
    utilityItems.push(
      navItem({
        id: "utility-account",
        href: "/account/profile",
        label: "Account",
        icon: UserRound,
        description: "Profile and preferences",
      }),
    );
  }

  if (role === "admin" && activeSection.id !== "admin") {
    utilityItems.push(
      navItem({
        id: "utility-admin",
        href: "/admin/users",
        label: "Admin",
        icon: Shield,
        description: "Operational controls",
      }),
    );
  }

  return utilityItems;
}

export function getMobileNavigationContext(pathname: string, role: UserRole): MobileNavigationContext {
  const activeSection = getActiveNavSectionForRole(pathname, role);
  const contextualPrimaryItems = activeSection.mobilePrimaryItems;
  const contextualSecondaryItems = activeSection.mobileSecondaryItems ?? [];
  const activeContextualHref = getActiveContextualHref(pathname, [
    ...contextualPrimaryItems,
    ...contextualSecondaryItems,
  ]);

  return {
    activeSection,
    switcherGroups: buildMobileSwitcherGroups(role),
    contextualPrimaryItems,
    contextualSecondaryItems,
    activeContextualHref,
    utilityItems: buildUtilityItems(activeSection, role),
  };
}
