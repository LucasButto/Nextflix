"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
} from "firebase/auth";
import { auth } from "@/firebase/config";

// ─── Cookie helpers ───────────────────────────────────────────────────────────
// El middleware de Next.js no puede acceder al SDK de Firebase (Edge Runtime),
// así que usamos una cookie liviana como señal de autenticación.
// La seguridad real de los datos sigue siendo responsabilidad de Firestore Rules.

const AUTH_COOKIE = "nextflix_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function setAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  isGuest: boolean;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<User | null>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialGuest(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("fw_guest") === "true";
}

/**
 * Errores donde tiene sentido reintentar con redirect en vez de popup.
 * - popup-blocked: el navegador / extensiones bloquearon la ventana hija.
 * - popup-closed-by-user: cerró el popup antes de loguear (suele pasar con
 *   privacy badgers que cierran ventanas no esperadas).
 * - cancelled-popup-request: se disparó otro popup mientras este pendía.
 * - operation-not-supported-in-this-environment: COOP/COEP estricto.
 * - web-storage-unsupported / unauthorized-domain: no aplican fallback,
 *   propagamos el error original.
 */
const POPUP_FALLBACK_ERRORS = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(getInitialGuest);

  useEffect(() => {
    // Procesar el resultado del redirect de Google. Si el último login fue
    // por signInWithRedirect (porque el popup quedó bloqueado), Firebase
    // resuelve la promesa al volver a esta página. Si no hubo redirect en
    // curso, devuelve null y no hace nada.
    getRedirectResult(auth).catch((error) => {
      // No imprimimos ruido si no hay redirect pendiente.
      if (error?.code !== "auth/no-auth-event") {
        console.error("Error procesando redirect de Google:", error);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        setIsGuest(false);
        localStorage.removeItem("fw_guest");
        setAuthCookie();
      } else {
        setUser(null);
        // Solo limpiar la cookie si tampoco es guest
        if (!localStorage.getItem("fw_guest")) {
          clearAuthCookie();
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Login con Google. Intenta popup primero (mejor UX, no recarga la página).
   * Si el navegador o extensiones bloquean el popup, hace fallback automático
   * a signInWithRedirect, que sale a la página de login de Google y vuelve.
   * En el caso del redirect, esta función nunca resuelve a un User porque el
   * navegador navega antes — devuelve null y la sesión se establece cuando
   * el usuario vuelve a la app y se ejecuta getRedirectResult en el useEffect.
   */
  const loginWithGoogle = async (): Promise<User | null> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // onAuthStateChanged se encarga de setear la cookie
      return result.user;
    } catch (error) {
      const code = (error as AuthError)?.code;
      if (code && POPUP_FALLBACK_ERRORS.has(code)) {
        // Fallback transparente: usar redirect. El navegador va a navegar
        // a accounts.google.com y volver. La cookie se setea en el
        // onAuthStateChanged que se dispara tras getRedirectResult.
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw error;
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    localStorage.setItem("fw_guest", "true");
    setAuthCookie(); // guests también pueden acceder a /tu-lista (lista local)
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem("fw_guest");
    localStorage.removeItem("fw_watchlist");
    clearAuthCookie();
  };

  const isLoggedIn = !!user;
  const isAuthenticated = isLoggedIn || isGuest;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        isLoggedIn,
        isAuthenticated,
        loginWithGoogle,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export default AuthContext;
