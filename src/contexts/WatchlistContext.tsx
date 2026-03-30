"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, isGuest } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (isLoggedIn && user?.uid) {
        try {
          const docRef = doc(db, "watchlists", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setWatchlist(snap.data().items || []);
          } else {
            const local = getLocalWatchlist();
            if (local.length > 0) {
              setWatchlist(local);
              await setDoc(docRef, { items: local });
              localStorage.removeItem("fw_watchlist");
            }
          }
        } catch {
          setWatchlist(getLocalWatchlist());
        }
      } else if (isGuest) {
        setWatchlist(getLocalWatchlist());
      }
      setLoaded(true);
    }
    load();
  }, [isLoggedIn, isGuest, user?.uid]);

  useEffect(() => {
    if (!loaded) return;
    if (isLoggedIn && user?.uid) {
      const docRef = doc(db, "watchlists", user.uid);
      setDoc(docRef, { items: watchlist }).catch(console.error);
    } else if (isGuest) {
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
