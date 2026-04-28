"use client";
import { useTranslations } from "next-intl";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { posterUrl } from "@/services/tmdb";
import type { RandomPickerItem } from "@/types/randomPicker";

interface ReelProps {
  strip: RandomPickerItem[];
  translateY: number;
  transitionOn: boolean;
  hasResult: boolean;
}

export default function Reel({
  strip,
  translateY,
  transitionOn,
  hasResult,
}: ReelProps) {
  const t = useTranslations("myList.randomPicker");

  if (strip.length === 0) {
    return (
      <div className="random-picker__reel">
        <div className="random-picker__placeholder">
          <CasinoRoundedIcon className="random-picker__placeholder-icon" />
          <p>{t("placeholder")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="random-picker__reel">
      <div
        className={`random-picker__strip ${
          transitionOn ? "random-picker__strip--animating" : ""
        }`}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {strip.map((it, idx) => (
          <div key={idx} className="random-picker__strip-item">
            <FadeImage
              src={posterUrl(it.poster_path, "xs")}
              alt=""
              width={36}
              height={54}
              sizes="36px"
              className="random-picker__strip-poster"
              loading="lazy"
            />
            <span className="random-picker__strip-title">{it.title}</span>
            {it.media_type === "tv" ? (
              <LiveTvRoundedIcon className="random-picker__strip-type" />
            ) : (
              <MovieRoundedIcon className="random-picker__strip-type" />
            )}
          </div>
        ))}
      </div>
      <div className="random-picker__fade random-picker__fade--top" />
      <div className="random-picker__fade random-picker__fade--bottom" />
      <div
        className={`random-picker__indicator ${
          hasResult ? "random-picker__indicator--won" : ""
        }`}
      />
    </div>
  );
}
