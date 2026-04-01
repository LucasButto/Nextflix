"use client";
import { useState, useRef } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import FadeImage from "@/components/shared/FadeImage/FadeImage";
import { tmdbClientFetch } from "@/services/tmdb-client";
import { posterUrl, profileUrl } from "@/services/tmdb";
import { extractYear } from "@/utils/dates";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type {
  SearchResult,
  SearchResponse,
  MovieResult,
  SeriesResult,
  PersonResult,
} from "@/types/tmdb";
import "@/styles/pages/search/search.scss";

export default function BuscarPage() {
  const t = useTranslations("search");
  const locale = useLocale();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef(false);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      cancelRef.current = false;
      tmdbClientFetch<SearchResponse>("/search/multi", locale, {
        query: value,
        page: 1,
      })
        .then((data) => {
          if (!cancelRef.current) {
            setResults(data.results ?? []);
            setSearched(true);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelRef.current) {
            setResults([]);
            setSearched(true);
            setLoading(false);
          }
        });
    }, 400);
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    cancelRef.current = true;
    setQuery("");
    setResults([]);
    setSearched(false);
    setLoading(false);
  }

  const showHint = !query && !searched;
  const showNoResults = searched && !loading && results.length === 0;

  return (
    <div className="search-page">
      <div className="search-box">
        <SearchRoundedIcon className="search-box__icon" />
        <input
          type="text"
          placeholder={t("placeholder")}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="search-box__input"
          autoFocus
        />
        {query && (
          <button onClick={handleClear} className="search-box__clear">
            ✕
          </button>
        )}
      </div>

      {loading && <div className="search-loading-bar" />}

      {showHint && (
        <div className="search-hint">
          <SearchRoundedIcon className="search-hint__icon" />
          <p>{t("hint")}</p>
        </div>
      )}

      {showNoResults && (
        <div className="search-hint">
          <p>{t("noResults", { query })}</p>
        </div>
      )}

      <div className="search-grid">
        {results.map((item) => {
          if (item.media_type === "person") {
            const person = item as PersonResult;
            return (
              <Link
                key={`p-${person.id}`}
                href={`/actor/${person.id}`}
                className="search-result"
              >
                <FadeImage
                  src={profileUrl(person.profile_path, "sm")}
                  alt={person.name}
                  width={120}
                  height={180}
                  className="search-result__img"
                  loading="lazy"
                />
                <div className="search-result__info">
                  <span className="search-result__type">{t("actor")}</span>
                  <h3 className="search-result__title">{person.name}</h3>
                  {person.known_for_department && (
                    <p className="search-result__sub">
                      {person.known_for_department}
                    </p>
                  )}
                </div>
              </Link>
            );
          }
          if (item.media_type === "tv") {
            const series = item as SeriesResult;
            const year = extractYear(series.first_air_date);
            return (
              <Link
                key={`tv-${series.id}`}
                href={`/series/${series.id}`}
                className="search-result"
              >
                <FadeImage
                  src={posterUrl(series.poster_path, "sm")}
                  alt={series.name}
                  width={120}
                  height={180}
                  className="search-result__img"
                  loading="lazy"
                />
                <div className="search-result__info">
                  <span className="search-result__type">{t("series")}</span>
                  <h3 className="search-result__title">{series.name}</h3>
                  <div className="search-result__meta">
                    {year && <span>{year}</span>}
                    {series.vote_average > 0 && (
                      <span>⭐ {series.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                  {series.overview && (
                    <p className="search-result__overview">{series.overview}</p>
                  )}
                </div>
              </Link>
            );
          }
          const movie = item as MovieResult;
          const year = extractYear(movie.release_date);
          return (
            <Link
              key={`movie-${movie.id}`}
              href={`/movies/${movie.id}`}
              className="search-result"
            >
              <FadeImage
                src={posterUrl(movie.poster_path, "sm")}
                alt={movie.title}
                width={120}
                height={180}
                className="search-result__img"
                loading="lazy"
              />
              <div className="search-result__info">
                <span className="search-result__type">{t("movie")}</span>
                <h3 className="search-result__title">{movie.title}</h3>
                <div className="search-result__meta">
                  {year && <span>{year}</span>}
                  {movie.vote_average > 0 && (
                    <span>⭐ {movie.vote_average.toFixed(1)}</span>
                  )}
                </div>
                {movie.overview && (
                  <p className="search-result__overview">{movie.overview}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
