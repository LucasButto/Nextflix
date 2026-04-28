"use client";
import { useEffect } from "react";

/** Locks body scroll while the component using this hook is mounted. */
export function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}
