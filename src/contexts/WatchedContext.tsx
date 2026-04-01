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

export function WatchedProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, isGuest, loading: authLoading } = useAuth();
  const [watched, setWatched] = useState<WatchedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      setLoaded(false);
      if (isLoggedIn && user?.uid) {
        try {
          const docRef = doc(db, "watched", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setWatched(snap.data().items || []);
          } else {
            const local = getLocalWatched();
            if (local.length > 0) {
              setWatched(local);
              await setDoc(docRef, { items: local });
              localStorage.removeItem("fw_watched");
            } else {
              setWatched([]);
            }
          }
          loadedForRef.current = user.uid;
        } catch {
          setWatched(getLocalWatched());
          loadedForRef.current = user.uid;
        }
      } else if (isGuest) {
        setWatched(getLocalWatched());
        loadedForRef.current = "guest";
      } else {
        setWatched([]);
        loadedForRef.current = "anonymous";
      }
      setLoaded(true);
    }
    loadedForRef.current = null;
    load();
  }, [isLoggedIn, isGuest, user?.uid, authLoading]);

  useEffect(() => {
    if (!loaded) return;

    if (isLoggedIn && user?.uid) {
      if (loadedForRef.current !== user.uid) return;
      const docRef = doc(db, "watched", user.uid);
      setDoc(docRef, { items: watched }).catch(console.error);
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
