"use client";
import { useState } from "react";
import "./FadeImage.scss";

type FadeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  alt: string;
  wrapperClassName?: string;
  /**
   * Variante de skeleton:
   * - "rect" (default): rectángulo con aspect-ratio heredado del wrapper
   * - "circle": avatar redondo
   * - "fill": se adapta al contenedor (position absolute)
   *
   * Si no se especifica y se usa fill={true}, se auto-detecta como "fill".
   */
  skeletonVariant?: "rect" | "circle" | "fill";
  /** Simula el comportamiento fill de next/image → posiciona la img absolutamente */
  fill?: boolean;
  /** Simula priority de next/image → convierte a loading="eager" */
  priority?: boolean;
};

export default function FadeImage({
  wrapperClassName = "",
  skeletonVariant,
  className = "",
  alt,
  onLoad,
  fill,
  priority,
  loading,
  style,
  ...rest
}: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);

  const variant = skeletonVariant ?? (fill ? "fill" : "rect");

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    if (onLoad) {
      (onLoad as (e: React.SyntheticEvent<HTMLImageElement>) => void)(e);
    }
  };

  const fillStyle: React.CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }
    : {};

  return (
    <div
      className={`fade-image ${
        variant === "fill" ? "fade-image--fill" : ""
      } ${wrapperClassName}`}
    >
      {!loaded && (
        <div
          className={`fade-image__skeleton ${
            variant === "circle" ? "fade-image__skeleton--circle" : ""
          } ${variant === "fill" ? "fade-image__skeleton--fill" : ""}`}
        />
      )}
      <img
        {...rest}
        alt={alt}
        loading={
          priority
            ? "eager"
            : ((loading as "lazy" | "eager" | undefined) ?? "lazy")
        }
        style={{ ...fillStyle, ...style }}
        className={`${className} fade-image__img ${loaded ? "fade-image__img--visible" : ""}`}
        onLoad={handleLoad}
      />
    </div>
  );
}
