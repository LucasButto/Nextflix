"use client";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import {
  getItemRegionProviders,
  normalizeProviderName,
} from "@/utils/randomPicker";
import { useTypeFilter } from "@/hooks/RandomPickerHooks/useTypeFilter";
import { useCountryFilter } from "@/hooks/RandomPickerHooks/useCountryFilter";
import { usePlatformFilter } from "@/hooks/RandomPickerHooks/usePlatformFilter";
import { useReel } from "@/hooks/RandomPickerHooks/useReel";
import TypeFilter from "./TypeFilter/TypeFilter";
import CountrySelector from "./CountrySelector/CountrySelector";
import PlatformSelector from "./PlatformSelector/PlatformSelector";
import Reel from "./Reel/Reel";
import PickerActions from "./PickerActions/PickerActions";
import type { RandomPickerItem } from "@/types/randomPicker";
import "./RandomPicker.scss";

interface RandomPickerProps {
  onClose: () => void;
  items: RandomPickerItem[];
  loadingProviders?: boolean;
  titleOverride?: string;
}

export default function RandomPicker({
  onClose,
  items,
  loadingProviders = false,
  titleOverride,
}: RandomPickerProps) {
  const t = useTranslations("myList.randomPicker");

  // ─── Filters ───────────────────────────────────────────────────────────────
  const {
    showTypeFilters,
    includeMovies,
    setIncludeMovies,
    includeSeries,
    setIncludeSeries,
    typeFilteredItems,
    noTypeFilter,
  } = useTypeFilter(items);

  const {
    hasRegionData,
    availableCountries,
    effectiveCountry,
    setSelectedCountry,
  } = useCountryFilter(items);

  const {
    allProviders,
    popularProviders,
    otherProviders,
    selectedNames,
    selectedCount,
    singleSelected,
    toggleProvider,
    resetProviders,
  } = usePlatformFilter({ typeFilteredItems, effectiveCountry });

  // ─── Pool final ────────────────────────────────────────────────────────────
  const hasProviderData = useMemo(
    () =>
      items.some(
        (i) => i.providersByRegion !== undefined || i.providers !== undefined,
      ),
    [items],
  );

  const pool = useMemo(() => {
    return typeFilteredItems.filter((item) => {
      if (!hasProviderData || selectedNames === null) return true;
      const regionProviders = getItemRegionProviders(item, effectiveCountry);
      if (regionProviders.length === 0) return false;
      return regionProviders.some((p) =>
        selectedNames.has(normalizeProviderName(p.name)),
      );
    });
  }, [typeFilteredItems, hasProviderData, selectedNames, effectiveCountry]);

  const { strip, translateY, transitionOn, spinning, result, canSpin, spin } =
    useReel({ pool });

  // ─── Dropdown UI ───────────────────────────────────────────────────────────
  const [countryListOpen, setCountryListOpen] = useState(false);
  const [platformListOpen, setPlatformListOpen] = useState(false);

  const closeDropdowns = useCallback(() => {
    setCountryListOpen(false);
    setPlatformListOpen(false);
  }, []);

  // ─── Side effects ──────────────────────────────────────────────────────────
  useBodyScrollLock();

  useEscapeKey(
    useCallback(() => {
      if (platformListOpen) return setPlatformListOpen(false);
      if (countryListOpen) return setCountryListOpen(false);
      if (!spinning) onClose();
    }, [platformListOpen, countryListOpen, spinning, onClose]),
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSpin = () => {
    closeDropdowns();
    spin();
  };

  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    setCountryListOpen(false);
  };

  const handleResetProviders = () => {
    resetProviders();
    setPlatformListOpen(false);
  };

  const handleOverlayClick = () => {
    if (platformListOpen || countryListOpen) return closeDropdowns();
    if (!spinning) onClose();
  };

  // ─── Display flags ─────────────────────────────────────────────────────────
  const emptyAll = items.length === 0;
  const emptyForFilter =
    !emptyAll && !noTypeFilter && pool.length === 0 && !loadingProviders;
  const showProviderSection =
    loadingProviders || (hasProviderData && allProviders.length > 0);
  const showCountrySection =
    loadingProviders || (hasRegionData && availableCountries.length > 0);

  return (
    <div
      className="random-picker__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="random-picker-title"
      onClick={handleOverlayClick}
    >
      <div
        className="random-picker__modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="random-picker__header">
          <div id="random-picker-title" className="random-picker__title">
            <CasinoRoundedIcon />
            {titleOverride ?? t("title")}
          </div>
          <button
            type="button"
            className="random-picker__close"
            onClick={onClose}
            disabled={spinning}
            aria-label={t("close")}
          >
            <CloseRoundedIcon />
          </button>
        </header>

        <div className="random-picker__body">
          {emptyAll ? (
            <p className="random-picker__hint">{t("empty")}</p>
          ) : (
            <>
              {showTypeFilters && (
                <TypeFilter
                  includeMovies={includeMovies}
                  setIncludeMovies={setIncludeMovies}
                  includeSeries={includeSeries}
                  setIncludeSeries={setIncludeSeries}
                  disabled={spinning}
                />
              )}

              {(showCountrySection || showProviderSection) && (
                <div className="random-picker__filter-row">
                  {showProviderSection && (
                    <PlatformSelector
                      popularProviders={popularProviders}
                      otherProviders={otherProviders}
                      selectedNames={selectedNames}
                      selectedCount={selectedCount}
                      singleSelected={singleSelected}
                      loading={loadingProviders}
                      open={platformListOpen}
                      onToggle={() => {
                        setPlatformListOpen((v) => !v);
                        setCountryListOpen(false);
                      }}
                      onSelectProvider={toggleProvider}
                      onResetProviders={handleResetProviders}
                      disabled={spinning}
                    />
                  )}
                  {showCountrySection && (
                    <CountrySelector
                      effectiveCountry={effectiveCountry}
                      availableCountries={availableCountries}
                      loading={loadingProviders}
                      open={countryListOpen}
                      onToggle={() => {
                        setCountryListOpen((v) => !v);
                        setPlatformListOpen(false);
                      }}
                      onSelect={handleSelectCountry}
                      disabled={spinning}
                    />
                  )}
                </div>
              )}

              <Reel
                strip={strip}
                translateY={translateY}
                transitionOn={transitionOn}
                hasResult={result !== null}
              />

              {noTypeFilter && (
                <p className="random-picker__hint random-picker__hint--warn">
                  {t("needSelection")}
                </p>
              )}
              {!noTypeFilter && emptyForFilter && (
                <p className="random-picker__hint random-picker__hint--warn">
                  {t("emptyForFilter")}
                </p>
              )}

              <PickerActions
                result={result}
                spinning={spinning}
                canSpin={canSpin}
                onSpin={handleSpin}
                onClose={onClose}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
