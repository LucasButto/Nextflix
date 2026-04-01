import "@/styles/globals.scss";
import "@/styles/detail.scss";
import { AuthProvider } from "@/contexts/AuthContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { WatchedProvider } from "@/contexts/WatchedContext";
import LoginGate from "@/components/auth/LoginGate/LoginGate";
import NavBar from "@/components/layout/NavBar/NavBar";
import ScrollToTop from "@/components/layout/ScrollToTop/ScrollToTop";
import { ReactNode } from "react";

export const metadata = {
  title: "Nextflix — Películas y Series",
  description:
    "Descubrí películas y series en tendencia. Tu plataforma de streaming favorita.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
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
      </body>
    </html>
  );
}
