import "@/styles/globals.scss";
import "@/styles/detail.scss";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AuthProvider } from "@/contexts/AuthContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { WatchedProvider } from "@/contexts/WatchedContext";
import LoginGate from "@/components/auth/LoginGate/LoginGate";
import NavBar from "@/components/layout/NavBar/NavBar";
import ScrollToTop from "@/components/layout/ScrollToTop/ScrollToTop";
import { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <WatchlistProvider>
              <WatchedProvider>
                <LoginGate>
                  <ScrollToTop />
                  <NavBar />
                  <main className="page-container">{children}</main>
                </LoginGate>
              </WatchedProvider>
            </WatchlistProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
