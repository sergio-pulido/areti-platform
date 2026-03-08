import type { Metadata } from "next";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Areti Platform",
  description:
    "A Stoic-Epicurean platform with secure auth, guided practices, journaling, community, and AI support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
