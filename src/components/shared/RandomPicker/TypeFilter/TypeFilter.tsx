"use client";
import { useTranslations } from "next-intl";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import LiveTvRoundedIcon from "@mui/icons-material/LiveTvRounded";

interface TypeFilterProps {
  includeMovies: boolean;
  setIncludeMovies: (v: boolean) => void;
  includeSeries: boolean;
  setIncludeSeries: (v: boolean) => void;
  disabled: boolean;
}

export default function TypeFilter({
  includeMovies,
  setIncludeMovies,
  includeSeries,
  setIncludeSeries,
  disabled,
}: TypeFilterProps) {
  const t = useTranslations("myList.randomPicker");

  return (
    <div className="random-picker__filters">
      <label
        className={`random-picker__filter ${
          includeMovies ? "random-picker__filter--checked" : ""
        } ${disabled ? "random-picker__filter--disabled" : ""}`}
      >
        <input
          type="checkbox"
          checked={includeMovies}
          onChange={(e) => setIncludeMovies(e.target.checked)}
          disabled={disabled}
        />
        <span className="random-picker__filter-icon">
          <MovieRoundedIcon />
        </span>
        <span className="random-picker__filter-label">{t("movies")}</span>
      </label>

      <label
        className={`random-picker__filter ${
          includeSeries ? "random-picker__filter--checked" : ""
        } ${disabled ? "random-picker__filter--disabled" : ""}`}
      >
        <input
          type="checkbox"
          checked={includeSeries}
          onChange={(e) => setIncludeSeries(e.target.checked)}
          disabled={disabled}
        />
        <span className="random-picker__filter-icon">
          <LiveTvRoundedIcon />
        </span>
        <span className="random-picker__filter-label">{t("series")}</span>
      </label>
    </div>
  );
}
