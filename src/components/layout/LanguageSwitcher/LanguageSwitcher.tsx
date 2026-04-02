"use client";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { useTransition } from "react";
import "./LanguageSwitcher.scss";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = locale === "es" ? "en" : "es";
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <button
      className={`lang-switcher lang-switcher--${locale} ${isPending ? "lang-switcher--pending" : ""}`}
      onClick={toggle}
      disabled={isPending}
      aria-label={`Cambiar idioma a ${locale === "es" ? "EN" : "ES"}`}
    >
      <span className="lang-switcher__knob" aria-hidden="true" />
      <span
        className={`lang-switcher__label ${locale === "es" ? "lang-switcher__label--active" : ""}`}
      >
        ES
      </span>
      <span
        className={`lang-switcher__label ${locale === "en" ? "lang-switcher__label--active" : ""}`}
      >
        EN
      </span>
    </button>
  );
}
