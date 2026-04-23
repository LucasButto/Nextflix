"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getProviderHomepage } from "@/utils/media";
import type { WatchProviderRegion, StreamingProvider } from "@/types/tmdb";
import "./WatchProviders.scss";

const IMG_BASE = "https://image.tmdb.org/t/p";

// Prioridad de países: LATAM primero, luego resto del mundo
const COUNTRY_PRIORITY: Record<string, number> = {
  AR: 1,
  MX: 2,
  CO: 3,
  CL: 4,
  PE: 5,
  UY: 6,
  EC: 7,
  BO: 8,
  PY: 9,
  VE: 10,
  ES: 11,
  US: 12,
  GB: 13,
  CA: 14,
  AU: 15,
  BR: 16,
  FR: 17,
  DE: 18,
  IT: 19,
  JP: 20,
  PT: 21,
  NL: 22,
  BE: 23,
  CH: 24,
  AT: 25,
  PL: 26,
  SE: 27,
  NO: 28,
  DK: 29,
  FI: 30,
};

function getCountryName(code: string, locale: string): string {
  try {
    const lang = locale === "en" ? "en-US" : "es-419";
    const names = new Intl.DisplayNames([lang], { type: "region" });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

function sortCountries(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const pa = COUNTRY_PRIORITY[a] ?? 99;
    const pb = COUNTRY_PRIORITY[b] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
}

interface WatchProvidersProps {
  allProviders: Record<string, WatchProviderRegion>;
  locale: string;
}

export default function WatchProviders({
  allProviders,
  locale,
}: WatchProvidersProps) {
  const t = useTranslations("detail");

  // Solo mostrar países que tienen proveedores flatrate
  const availableCountries = sortCountries(
    Object.entries(allProviders)
      .filter(([, region]) => (region.flatrate?.length ?? 0) > 0)
      .map(([code]) => code),
  );

  // AR como default, sino el primero disponible
  const defaultCountry = availableCountries.includes("AR")
    ? "AR"
    : (availableCountries[0] ?? "");

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (availableCountries.length === 0) return null;

  const region = allProviders[selectedCountry];
  const providers = region?.flatrate ?? [];
  const watchLink = region?.link;

  return (
    <div className="detail-providers-section">
      <div className="detail-providers-header">
        <h3 className="section-title">{t("whereToWatch")}</h3>

        {/* Selector de país */}
        <div className="wp-selector" ref={dropdownRef}>
          <button
            className="wp-selector__trigger"
            onClick={() => setIsOpen((o) => !o)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <img
              src={`https://flagcdn.com/20x15/${selectedCountry.toLowerCase()}.png`}
              alt={selectedCountry}
              className="wp-selector__flag"
              width={20}
              height={15}
            />
            <span className="wp-selector__name">
              {getCountryName(selectedCountry, locale)}
            </span>
            <svg
              className={`wp-selector__chevron${isOpen ? " wp-selector__chevron--up" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isOpen && (
            <ul className="wp-selector__dropdown" role="listbox">
              {availableCountries.map((code) => (
                <li
                  key={code}
                  role="option"
                  aria-selected={code === selectedCountry}
                >
                  <button
                    className={`wp-selector__option${code === selectedCountry ? " wp-selector__option--active" : ""}`}
                    onClick={() => {
                      setSelectedCountry(code);
                      setIsOpen(false);
                    }}
                  >
                    <img
                      src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
                      alt={code}
                      className="wp-selector__flag"
                      width={20}
                      height={15}
                    />
                    <span>{getCountryName(code, locale)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="detail-providers-list">
        {watchLink && (
          <a
            href={watchLink}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-provider-badge"
          >
            <img
              src="/justwatch.svg"
              alt="JustWatch"
              width={28}
              height={28}
              className="detail-provider-logo"
            />
            JustWatch
          </a>
        )}
        {providers.map((p: StreamingProvider) => {
          const href = getProviderHomepage(p.provider_id);
          const content = (
            <>
              <img
                src={`${IMG_BASE}/w45${p.logo_path}`}
                alt={p.provider_name}
                width={28}
                height={28}
                className="detail-provider-logo"
              />
              {p.provider_name}
            </>
          );
          return href ? (
            <a
              key={p.provider_id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-provider-badge"
            >
              {content}
            </a>
          ) : (
            <div key={p.provider_id} className="detail-provider-badge">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
