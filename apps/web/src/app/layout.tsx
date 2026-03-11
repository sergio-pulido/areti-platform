import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Areti Platform",
  description:
    "A Stoic-Epicurean platform with Academy knowledge, guided practices, journaling, community, and AI support.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html lang={initialLocale}>
      <body className="antialiased">
        <I18nProvider initialLocale={initialLocale}>
          <ServiceWorkerRegistration />
          {children}
          <CookieConsentBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
