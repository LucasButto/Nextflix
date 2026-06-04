"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "./AuthContext";

interface WatchlistItem {
  id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
  added_at: number;
}

interface AddToWatchlistInput {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  loaded: boolean;
  addToWatchlist: (item: AddToWatchlistInput) => void;
  removeFromWatchlist: (id: number, mediaType: string) => void;
  isInWatchlist: (id: number, mediaType: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

/**
 * Mergea dos listas sin duplicados por (id + media_type).
 * Los items de `primary` ganan prioridad y van primero (preservar orden
 * de cambios optimistas locales).
 */
function mergeUnique(
  primary: WatchlistItem[],
  secondary: WatchlistItem[],
): WatchlistItem[] {
  const keyOf = (i: WatchlistItem) => `${i.media_type}-${i.id}`;
  const seen = new Set(primary.map(keyOf));
  const newOnes = secondary.filter((i) => !seen.has(keyOf(i)));
  return [...primary, ...newOnes];
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, isGuest, loading: authLoading } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Identidad de quién está cargado: uid | "guest" | "anonymous" | null.
  // null significa "carga falló o aún no cargada" → bloquea el guardado.
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const newIdentity =
      isLoggedIn && user?.uid ? user.uid : isGuest ? "guest" : "anonymous";

    const prevIdentity = loadedForRef.current;
    loadedForRef.current = null;

    let cancelled = false;

    async function load() {
      if (prevIdentity !== null && prevIdentity !== newIdentity) {
        setWatchlist([]);
      }
      setLoaded(false);

      if (isLoggedIn && user?.uid) {
        try {
          const docRef = doc(db, "watchlists", user.uid);
          const snap = await getDoc(docRef);
          if (cancelled) return;

          const firestoreItems: WatchlistItem[] = snap.exists()
            ? snap.data().items || []
            : [];
          const localToMigrate: WatchlistItem[] = !snap.exists()
            ? getLocalWatchlist()
            : [];

          setWatchlist((current) =>
            mergeUnique(current, [...firestoreItems, ...localToMigrate]),
          );

          if (!snap.exists() && localToMigrate.length > 0) {
            localStorage.removeItem("fw_watchlist");
          }

          loadedForRef.current = user.uid;
        } catch (err) {
          console.error("Failed to load watchlist from Firestore:", err);
          // NO setear loadedForRef → bloquea el guardado automático
        }
      } else if (isGuest) {
        setWatchlist((current) => mergeUnique(current, getLocalWatchlist()));
        loadedForRef.current = "guest";
      } else {
        loadedForRef.current = "anonymous";
      }

      if (!cancelled) setLoaded(true);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isGuest, user?.uid, authLoading]);

  // Efecto de guardado: el guard `loadedForRef.current !== user.uid` ya
  // estaba; ahora es efectivo porque el catch NO setea loadedForRef.
  useEffect(() => {
    if (!loaded) return;
    if (loadedForRef.current === null) return; // Load falló → no guardar

    if (isLoggedIn && user?.uid) {
      if (loadedForRef.current !== user.uid) return;
      const docRef = doc(db, "watchlists", user.uid);
      setDoc(docRef, { items: watchlist }).catch((err) =>
        console.error("Failed to save watchlist:", err),
      );
    } else if (isGuest) {
      if (loadedForRef.current !== "guest") return;
      saveLocalWatchlist(watchlist);
    }
  }, [watchlist, loaded, isLoggedIn, isGuest, user?.uid]);

  const addToWatchlist = useCallback((item: AddToWatchlistInput) => {
    setWatchlist((prev) => {
      const exists = prev.some(
        (i) =>
          i.id === item.id && i.media_type === (item.media_type ?? "movie"),
      );
      if (exists) return prev;
      return [
        {
          id: item.id,
          media_type: item.media_type ?? "movie",
          title: item.title ?? item.name ?? "",
          poster_path: item.poster_path,
          vote_average: item.vote_average,
          added_at: Date.now(),
        },
        ...prev,
      ];
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number, mediaType: string) => {
    setWatchlist((prev) =>
      prev.filter((i) => !(i.id === id && i.media_type === mediaType)),
    );
  }, []);

  const isInWatchlist = useCallback(
    (id: number, mediaType: string) => {
      return watchlist.some((i) => i.id === id && i.media_type === mediaType);
    },
    [watchlist],
  );

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        loaded,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

function getLocalWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("fw_watchlist") || "[]");
  } catch {
    return [];
  }
}

function saveLocalWatchlist(list: WatchlistItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("fw_watchlist", JSON.stringify(list));
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx)
    throw new Error("useWatchlist must be used inside WatchlistProvider");
  return ctx;
}

export default WatchlistContext;
