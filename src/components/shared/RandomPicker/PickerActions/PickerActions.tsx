"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import type { RandomPickerItem } from "@/types/randomPicker";

interface PickerActionsProps {
  result: RandomPickerItem | null;
  spinning: boolean;
  canSpin: boolean;
  onSpin: () => void;
  onClose: () => void;
}

export default function PickerActions({
  result,
  spinning,
  canSpin,
  onSpin,
  onClose,
}: PickerActionsProps) {
  const t = useTranslations("myList.randomPicker");

  const winnerHref = result
    ? result.media_type === "tv"
      ? `/series/${result.id}`
      : `/movies/${result.id}`
    : "";

  return (
    <div className="random-picker__actions">
      {result && (
        <Link
          href={winnerHref}
          onClick={onClose}
          className="random-picker__btn random-picker__btn--secondary"
        >
          <OpenInNewRoundedIcon />
          {t("viewDetail")}
        </Link>
      )}
      <button
        type="button"
        className="random-picker__btn random-picker__btn--primary"
        onClick={onSpin}
        disabled={!canSpin}
      >
        {spinning ? (
          <>
            <span className="random-picker__btn-spinner" />
            {t("spinning")}
          </>
        ) : result ? (
          <>
            <ReplayRoundedIcon />
            {t("again")}
          </>
        ) : (
          <>
            <CasinoRoundedIcon />
            {t("spin")}
          </>
        )}
      </button>
    </div>
  );
}
