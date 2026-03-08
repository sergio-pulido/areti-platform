import {
  AlertTriangle,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Clapperboard,
  FileCog,
  Compass,
  FlaskConical,
  FolderKanban,
  Home,
  KeyRound,
  Monitor,
  Notebook,
  NotebookPen,
  Settings,
  Shield,
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
  group?: string;
  matchSubpaths?: boolean;
  enabled?: boolean;
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
      "/library",
      "/practices",
      "/journal",
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
        href: "/library",
        label: "Library",
        icon: BookOpen,
        description: "Curated readings",
      },
      {
        href: "/practices",
        label: "Practices",
        icon: Compass,
        description: "Daily exercises",
      },
      {
        href: "/journal",
        label: "Journal",
        icon: Notebook,
        description: "Reflections and mood",
      },
    ],
  },
  {
    id: "companion",
    label: "Companion",
    href: "/chat",
    description: "Threaded AI conversations",
    matchPrefixes: ["/chat"],
    items: [
      {
        href: "/chat",
        label: "Conversations",
        icon: Bot,
        description: "Socratic AI workspace",
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
    description: "Profile, security, and personal controls",
    matchPrefixes: ["/account"],
    items: [
      {
        href: "/account",
        label: "Home",
        icon: Home,
        description: "Overview of your account",
        group: "Account",
        matchSubpaths: false,
      },
      {
        href: "/account/profile",
        label: "Profile",
        icon: UserRound,
        description: "Personal details and contact information",
        group: "Profile",
      },
      {
        href: "/account/settings",
        label: "Settings",
        icon: Settings,
        description: "Account preferences and settings",
        group: "Preferences",
      },
      {
        href: "/account/security",
        label: "Security",
        icon: Shield,
        description: "Security overview and recommendations",
        group: "Security",
      },
      {
        href: "/account/password",
        label: "Password",
        icon: KeyRound,
        description: "Change your password",
        group: "Security",
      },
      {
        href: "/account/sessions",
        label: "Sessions",
        icon: Monitor,
        description: "Manage active sessions and devices",
        group: "Security",
      },
      {
        href: "/account/danger",
        label: "Danger Zone",
        icon: AlertTriangle,
        description: "Irreversible account actions",
        group: "Security",
      },
      {
        href: "/account/notifications",
        label: "Notifications",
        icon: Bell,
        description: "Manage your notification preferences",
        group: "Communication",
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
