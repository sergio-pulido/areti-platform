import {
  BookOpen,
  Bot,
  FileCog,
  Compass,
  Home,
  Notebook,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const dashboardNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: Home,
    description: "Pulse and priorities",
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
    href: "/dashboard/community",
    label: "Community",
    icon: Users,
    description: "Guided circles",
  },
  {
    href: "/dashboard/chat",
    label: "Chatbot",
    icon: Bot,
    description: "Socratic companion",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    description: "Security and profile",
  },
  {
    href: "/dashboard/cms",
    label: "CMS",
    icon: FileCog,
    description: "Manage platform content",
  },
];
