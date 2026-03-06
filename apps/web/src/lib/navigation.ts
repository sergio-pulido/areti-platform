import {
  BookOpen,
  Bot,
  CalendarDays,
  Clapperboard,
  FileCog,
  Compass,
  FlaskConical,
  FolderKanban,
  Home,
  Notebook,
  NotebookPen,
  Shield,
  Star,
  Settings,
  Trophy,
  UserRound,
  UsersRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "MEMBER" | "ADMIN";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  matchSubpaths?: boolean;
};

export type NavSection = {
  id: string;
  label: string;
  href: string;
  description: string;
  matchPrefixes: string[];
  items: NavItem[];
};

export const dashboardNavSections: NavSection[] = [
  {
    id: "personal",
    label: "Personal",
    href: "/dashboard",
    description: "Solo work and self-development",
    matchPrefixes: [
      "/dashboard/library",
      "/dashboard/practices",
      "/dashboard/journal",
      "/dashboard/chat",
      "/dashboard",
    ],
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: Home,
        description: "Pulse and priorities",
        matchSubpaths: false,
      },
      {
        href: "/dashboard/library",
        label: "Library",
        icon: BookOpen,
        description: "Curated readings",
      },
      {
        href: "/dashboard/practices",
        label: "Practices",
        icon: Compass,
        description: "Daily exercises",
      },
      {
        href: "/dashboard/journal",
        label: "Journal",
        icon: Notebook,
        description: "Reflections and mood",
      },
      {
        href: "/dashboard/chat",
        label: "Chatbot",
        icon: Bot,
        description: "Socratic companion",
      },
    ],
  },
  {
    id: "community",
    label: "Community",
    href: "/community",
    description: "Collaborative growth and groups",
    matchPrefixes: ["/community"],
    items: [
      {
        href: "/community",
        label: "Circles",
        icon: Users,
        description: "Guided circles",
        matchSubpaths: false,
      },
      {
        href: "/community/challenges",
        label: "Challenges",
        icon: Trophy,
        description: "Shared goals",
      },
      {
        href: "/community/resources",
        label: "Resources",
        icon: FolderKanban,
        description: "Community assets",
      },
      {
        href: "/community/experts",
        label: "Experts",
        icon: UsersRound,
        description: "Mentors and coaches",
      },
      {
        href: "/community/events",
        label: "Events",
        icon: CalendarDays,
        description: "Live sessions",
      },
    ],
  },
  {
    id: "creator",
    label: "Creator",
    href: "/creator",
    description: "Publish content for members",
    matchPrefixes: ["/creator"],
    items: [
      {
        href: "/creator/cms",
        label: "CMS",
        icon: FileCog,
        description: "Content operations",
      },
      {
        href: "/creator/exercises",
        label: "Exercises",
        icon: FlaskConical,
        description: "Practice templates",
      },
      {
        href: "/creator/readings",
        label: "Readings",
        icon: NotebookPen,
        description: "Written content",
      },
      {
        href: "/creator/videos",
        label: "Videos",
        icon: Clapperboard,
        description: "Media publishing",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    href: "/account",
    description: "Profile and security controls",
    matchPrefixes: [
      "/account",
      "/account/settings",
      "/account/privacy",
      "/account/terms",
      "/account/cookies",
      "/dashboard/settings",
      "/legal/privacy",
      "/legal/terms",
      "/legal/cookies",
    ],
    items: [
      {
        href: "/account",
        label: "Profile",
        icon: UserRound,
        description: "Personal details",
      },
      {
        href: "/account/settings",
        label: "Settings",
        icon: Settings,
        description: "Security and access",
      },
      {
        href: "/account/privacy",
        label: "Privacy",
        icon: Shield,
        description: "Policy and data",
      },
      {
        href: "/account/terms",
        label: "Terms",
        icon: Star,
        description: "Platform rules",
      },
    ],
  },
];

export const dashboardNavItems: NavItem[] = dashboardNavSections.flatMap((section) => section.items);
export const topbarSections = dashboardNavSections.filter((section) => section.id !== "account");

export function canAccessCreator(role: UserRole): boolean {
  return role === "ADMIN";
}

export function getTopbarSectionsForRole(role: UserRole): NavSection[] {
  if (canAccessCreator(role)) {
    return topbarSections;
  }

  return topbarSections.filter((section) => section.id !== "creator");
}

export function getNavSectionById(sectionId: string): NavSection {
  const matched = dashboardNavSections.find((section) => section.id === sectionId);

  if (matched) {
    return matched;
  }

  return dashboardNavSections[0];
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) {
    return true;
  }

  if (item.matchSubpaths === false) {
    return false;
  }

  return pathname.startsWith(`${item.href}/`);
}

export function getNavSectionForPathname(pathname: string): NavSection {
  let currentMatch: NavSection | null = null;
  let currentMatchLength = -1;

  for (const section of dashboardNavSections) {
    for (const prefix of section.matchPrefixes) {
      const isMatch = pathname === prefix || pathname.startsWith(`${prefix}/`);

      if (isMatch && prefix.length > currentMatchLength) {
        currentMatch = section;
        currentMatchLength = prefix.length;
      }
    }
  }

  return currentMatch ?? dashboardNavSections[0];
}
