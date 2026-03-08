import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import "./globals.css";

const titleFont = Cormorant_Garamond({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      <body className={`${titleFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
