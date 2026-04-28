"use client";
import { useTranslations } from "next-intl";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { normalizeProviderName } from "@/utils/randomPicker";
import type { PickerProvider } from "@/types/randomPicker";

interface PlatformSelectorProps {
  popularProviders: PickerProvider[];
  otherProviders: PickerProvider[];
  selectedNames: Set<string> | null;
  selectedCount: number;
  singleSelected: PickerProvider | null;
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onSelectProvider: (name: string) => void;
  onResetProviders: () => void;
  disabled: boolean;
}

export default function PlatformSelector({
  popularProviders,
  otherProviders,
  selectedNames,
  selectedCount,
  singleSelected,
  loading,
  open,
  onToggle,
  onSelectProvider,
  onResetProviders,
  disabled,
}: PlatformSelectorProps) {
  const t = useTranslations("myList.randomPicker");

  const renderOption = (p: PickerProvider) => {
    const isActive =
      selectedNames !== null &&
      selectedNames.has(normalizeProviderName(p.name));
    return (
      <button
        key={p.id}
        type="button"
        className={`random-picker__platform-option ${
          isActive ? "random-picker__platform-option--active" : ""
        }`}
        onClick={() => onSelectProvider(p.name)}
      >
        <img
          src={p.logo_path}
          alt=""
          className="random-picker__platform-logo"
        />
        <span className="random-picker__platform-option-name">{p.name}</span>
        {isActive && (
          <CheckRoundedIcon className="random-picker__platform-check" />
        )}
      </button>
    );
  };

  return (
    <div className="random-picker__providers random-picker__providers--platform">
      <span className="random-picker__providers-label">{t("platforms")}</span>

      {loading ? (
        <div className="random-picker__platform-trigger random-picker__platform-trigger--loading">
          <span className="random-picker__btn-spinner" />
          <span className="random-picker__platform-trigger-name">
            {t("loadingPlatforms")}
          </span>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={`random-picker__platform-trigger ${
              open ? "random-picker__platform-trigger--open" : ""
            }`}
            onClick={onToggle}
            disabled={disabled}
          >
            {selectedNames === null ? (
              <span className="random-picker__platform-trigger-name">
                {t("allPlatforms")}
              </span>
            ) : singleSelected ? (
              <>
                <img
                  src={singleSelected.logo_path}
                  alt=""
                  className="random-picker__platform-logo"
                />
                <span className="random-picker__platform-trigger-name">
                  {singleSelected.name}
                </span>
              </>
            ) : (
              <span className="random-picker__platform-trigger-name">
                {t("nPlatforms", { count: selectedCount })}
              </span>
            )}
            <KeyboardArrowDownRoundedIcon
              className={`random-picker__platform-chevron ${
                open ? "random-picker__platform-chevron--open" : ""
              }`}
            />
          </button>

          {open && (
            <div className="random-picker__platform-list">
              <button
                type="button"
                className={`random-picker__platform-option ${
                  selectedNames === null
                    ? "random-picker__platform-option--active"
                    : ""
                }`}
                onClick={onResetProviders}
              >
                <span className="random-picker__platform-option-name">
                  {t("allPlatforms")}
                </span>
                {selectedNames === null && (
                  <CheckRoundedIcon className="random-picker__platform-check" />
                )}
              </button>

              {popularProviders.length > 0 && (
                <>
                  <div className="random-picker__platform-divider" />
                  <div className="random-picker__platform-section-title">
                    {t("popularPlatforms")}
                  </div>
                  {popularProviders.map(renderOption)}
                </>
              )}

              {otherProviders.length > 0 && (
                <>
                  <div className="random-picker__platform-divider" />
                  <div className="random-picker__platform-section-title">
                    {t("otherPlatforms")}
                  </div>
                  {otherProviders.map(renderOption)}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
