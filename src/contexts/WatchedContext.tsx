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

interface WatchedItem {
  id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  vote_average: number;
  watched_at: number;
}

interface AddToWatchedInput {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

interface WatchedContextType {
  watched: WatchedItem[];
  loaded: boolean;
  addToWatched: (item: AddToWatchedInput) => void;
  removeFromWatched: (id: number, mediaType: string) => void;
  isWatched: (id: number, mediaType: string) => boolean;
}

const WatchedContext = createContext<WatchedContextType | null>(null);

function mergeUnique(
  primary: WatchedItem[],
  secondary: WatchedItem[],
): WatchedItem[] {
  const keyOf = (i: WatchedItem) => `${i.media_type}-${i.id}`;
  const seen = new Set(primary.map(keyOf));
  const newOnes = secondary.filter((i) => !seen.has(keyOf(i)));
  return [...primary, ...newOnes];
}

export function WatchedProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, isGuest, loading: authLoading } = useAuth();
  const [watched, setWatched] = useState<WatchedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
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
        setWatched([]);
      }
      setLoaded(false);

      if (isLoggedIn && user?.uid) {
        try {
          const docRef = doc(db, "watched", user.uid);
          const snap = await getDoc(docRef);
          if (cancelled) return;

          const firestoreItems: WatchedItem[] = snap.exists()
            ? snap.data().items || []
            : [];
          const localToMigrate: WatchedItem[] = !snap.exists()
            ? getLocalWatched()
            : [];

          setWatched((current) =>
            mergeUnique(current, [...firestoreItems, ...localToMigrate]),
          );

          if (!snap.exists() && localToMigrate.length > 0) {
            localStorage.removeItem("fw_watched");
          }

          loadedForRef.current = user.uid;
        } catch (err) {
          console.error("Failed to load watched from Firestore:", err);
        }
      } else if (isGuest) {
        setWatched((current) => mergeUnique(current, getLocalWatched()));
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

  useEffect(() => {
    if (!loaded) return;
    if (loadedForRef.current === null) return;

    if (isLoggedIn && user?.uid) {
      if (loadedForRef.current !== user.uid) return;
      const docRef = doc(db, "watched", user.uid);
      setDoc(docRef, { items: watched }).catch((err) =>
        console.error("Failed to save watched:", err),
      );
    } else if (isGuest) {
      if (loadedForRef.current !== "guest") return;
      saveLocalWatched(watched);
    }
  }, [watched, loaded, isLoggedIn, isGuest, user?.uid]);

  const addToWatched = useCallback((item: AddToWatchedInput) => {
    setWatched((prev) => {
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
          watched_at: Date.now(),
        },
        ...prev,
      ];
    });
  }, []);

  const removeFromWatched = useCallback((id: number, mediaType: string) => {
    setWatched((prev) =>
      prev.filter((i) => !(i.id === id && i.media_type === mediaType)),
    );
  }, []);

  const isWatched = useCallback(
    (id: number, mediaType: string) => {
      return watched.some((i) => i.id === id && i.media_type === mediaType);
    },
    [watched],
  );

  return (
    <WatchedContext.Provider
      value={{
        watched,
        loaded,
        addToWatched,
        removeFromWatched,
        isWatched,
      }}
    >
      {children}
    </WatchedContext.Provider>
  );
}

function getLocalWatched(): WatchedItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("fw_watched") || "[]");
  } catch {
    return [];
  }
}

function saveLocalWatched(list: WatchedItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("fw_watched", JSON.stringify(list));
}

export function useWatched() {
  const ctx = useContext(WatchedContext);
  if (!ctx) throw new Error("useWatched must be used inside WatchedProvider");
  return ctx;
}

export default WatchedContext;
