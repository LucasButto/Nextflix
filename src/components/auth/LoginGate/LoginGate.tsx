"use client";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import "./LoginGate.scss";

export default function LoginGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const t = useTranslations("login");

  if (loading) {
    return (
      <div className="login-gate__loader">
        <div className="login-gate__spinner" />
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  return <>{children}</>;
}

function LoginScreen() {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const router = useRouter();
  const t = useTranslations("login");

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    router.push("/");
  };

  return (
    <div className="login-screen">
      <div className="login-screen__bg-overlay" />
      <div className="login-screen__card">
        <img src="/Logo.png" alt="Logo" width={300} height={90} />
        <h2 className="login-screen__heading">{t("welcome")}</h2>
        <p className="login-screen__sub">{t("subtitle")}</p>
        <div className="login-screen__buttons">
          <button onClick={handleGoogle} className="login-screen__google-btn">
            <img src="/google-icon.svg" alt="Google" width={20} height={20} />
            {t("google")}
          </button>
          <button onClick={handleGuest} className="login-screen__guest-btn">
            {t("guest")}
          </button>
        </div>
      </div>
    </div>
  );
}
