import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Areti Platform",
    short_name: "Areti",
    description:
      "A Stoic-Epicurean platform with Academy knowledge, guided practices, journaling, community, and AI support.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0f172a",
    lang: "en",
    categories: ["education", "lifestyle", "productivity", "health"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/pwa-screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/pwa-screenshot-narrow.png",
        sizes: "540x720",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Open your daily Stoic dashboard.",
        url: "/dashboard",
      },
      {
        name: "Companion",
        short_name: "Companion",
        description: "Start a guided reflection chat.",
        url: "/chat",
      },
      {
        name: "Journal",
        short_name: "Journal",
        description: "Write today’s reflection.",
        url: "/journal",
      },
    ],
  };
}
