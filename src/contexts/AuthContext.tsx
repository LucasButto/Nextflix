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
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/firebase/config";

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
  loginWithGoogle: () => Promise<User>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialGuest(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("fw_guest") === "true";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(getInitialGuest);

  useEffect(() => {
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

  const loginWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // onAuthStateChanged se encarga de setear la cookie
    return result.user;
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    localStorage.setItem("fw_guest", "true");
    // No se setea la cookie → el middleware bloquea /tu-lista para invitados
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
