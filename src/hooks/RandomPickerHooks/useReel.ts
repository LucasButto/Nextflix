"use client";
import { useEffect, useRef, useState } from "react";
import {
  REEL_ITEM_HEIGHT,
  REEL_SPIN_DURATION_MS,
  REEL_STRIP_LENGTH,
  REEL_WINNER_INDEX,
} from "@/constants/randomPicker";
import { shuffle } from "@/utils/randomPicker";
import type { RandomPickerItem } from "@/types/randomPicker";

interface UseReelArgs {
  pool: RandomPickerItem[];
}

export function useReel({ pool }: UseReelArgs) {
  const [strip, setStrip] = useState<RandomPickerItem[]>([]);
  const [translateY, setTranslateY] = useState(0);
  const [transitionOn, setTransitionOn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<RandomPickerItem | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  const canSpin = pool.length > 0 && !spinning;

  const spin = () => {
    if (!canSpin) return;

    const shuffled = shuffle(pool);
    const newStrip = Array.from(
      { length: REEL_STRIP_LENGTH },
      (_, i) => shuffled[i % shuffled.length],
    );
    const winner = newStrip[REEL_WINNER_INDEX];

    setResult(null);
    setStrip(newStrip);
    setTranslateY(0);
    setTransitionOn(false);
    setSpinning(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionOn(true);
        setTranslateY(-(REEL_WINNER_INDEX - 1) * REEL_ITEM_HEIGHT);
      });
    });

    if (spinTimeoutRef.current !== null)
      window.clearTimeout(spinTimeoutRef.current);

    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      setResult(winner);
      spinTimeoutRef.current = null;
    }, REEL_SPIN_DURATION_MS);
  };

  return { strip, translateY, transitionOn, spinning, result, canSpin, spin };
}
