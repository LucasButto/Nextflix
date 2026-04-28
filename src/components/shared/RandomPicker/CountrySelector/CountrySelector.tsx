"use client";
import { useLocale, useTranslations } from "next-intl";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { getCountryName } from "@/utils/randomPicker";

interface CountrySelectorProps {
  effectiveCountry: string;
  availableCountries: string[];
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onSelect: (code: string) => void;
  disabled: boolean;
}

export default function CountrySelector({
  effectiveCountry,
  availableCountries,
  loading,
  open,
  onToggle,
  onSelect,
  disabled,
}: CountrySelectorProps) {
  const t = useTranslations("myList.randomPicker");
  const locale = useLocale();

  return (
    <div className="random-picker__providers random-picker__providers--country">
      <span className="random-picker__providers-label">{t("country")}</span>

      {loading ? (
        <div className="random-picker__platform-trigger random-picker__platform-trigger--loading">
          <span className="random-picker__btn-spinner" />
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
            <img
              src={`https://flagcdn.com/20x15/${effectiveCountry.toLowerCase()}.png`}
              alt={effectiveCountry}
              width={20}
              height={15}
              className="random-picker__flag"
            />
            <span className="random-picker__platform-trigger-name">
              {getCountryName(effectiveCountry, locale)}
            </span>
            <KeyboardArrowDownRoundedIcon
              className={`random-picker__platform-chevron ${
                open ? "random-picker__platform-chevron--open" : ""
              }`}
            />
          </button>

          {open && (
            <div className="random-picker__platform-list">
              {availableCountries.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`random-picker__platform-option ${
                    effectiveCountry === code
                      ? "random-picker__platform-option--active"
                      : ""
                  }`}
                  onClick={() => onSelect(code)}
                >
                  <img
                    src={`https://flagcdn.com/20x15/${code.toLowerCase()}.png`}
                    alt={code}
                    width={20}
                    height={15}
                    className="random-picker__flag"
                  />
                  <span className="random-picker__platform-option-name">
                    {getCountryName(code, locale)}
                  </span>
                  {effectiveCountry === code && (
                    <CheckRoundedIcon className="random-picker__platform-check" />
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
