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

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialGuest(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("fw_guest") === "true";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  // Inicializar isGuest directamente desde localStorage sin useEffect
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
        if (typeof window !== "undefined") localStorage.removeItem("fw_guest");
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    if (typeof window !== "undefined") localStorage.setItem("fw_guest", "true");
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setIsGuest(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("fw_guest");
      localStorage.removeItem("fw_watchlist");
    }
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
