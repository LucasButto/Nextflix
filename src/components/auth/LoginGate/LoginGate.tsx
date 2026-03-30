"use client";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./LoginGate.scss";

export default function LoginGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-gate__loader">
        <div className="login-gate__spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  return <>{children}</>;
}

function LoginScreen() {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const router = useRouter();

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
        <Image src="/logo.png" alt="Logo" width={300} height={90} priority />
        <h2 className="login-screen__heading">Bienvenido</h2>
        <p className="login-screen__sub">
          Ingresá con tu cuenta de Google o continuá como invitado para explorar
          películas y series.
        </p>
        <div className="login-screen__buttons">
          <button onClick={handleGoogle} className="login-screen__google-btn">
            <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
            Ingresar con Google
          </button>
          <button onClick={handleGuest} className="login-screen__guest-btn">
            Continuar como invitado
          </button>
        </div>
      </div>
    </div>
  );
}
