import type { Metadata, Viewport } from "next";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Areti Platform",
  description:
    "A Stoic-Epicurean platform with secure auth, guided practices, journaling, community, and AI support.",
  applicationName: "Areti",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Areti",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ServiceWorkerRegistration />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
