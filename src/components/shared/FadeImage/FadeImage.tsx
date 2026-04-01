"use client";
import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import "./FadeImage.scss";

type FadeImageProps = ImageProps & {
  wrapperClassName?: string;
  /**
   * Variante de skeleton:
   * - "rect" (default): rectángulo con aspect-ratio heredado del wrapper
   * - "circle": avatar redondo
   * - "fill": se adapta al contenedor (position absolute)
   *
   * Si no se especifica y la Image usa fill={true}, se auto-detecta como "fill".
   */
  skeletonVariant?: "rect" | "circle" | "fill";
};

export default function FadeImage({
  wrapperClassName = "",
  skeletonVariant,
  className = "",
  alt,
  onLoad,
  ...rest
}: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);

  // Auto-detect: si la Image usa fill, el wrapper también debe ser fill
  const isFill = "fill" in rest && rest.fill;
  const variant = skeletonVariant ?? (isFill ? "fill" : "rect");

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    if (onLoad) {
      (onLoad as (e: React.SyntheticEvent<HTMLImageElement>) => void)(e);
    }
  };

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
      <Image
        {...rest}
        alt={alt}
        className={`${className} fade-image__img ${loaded ? "fade-image__img--visible" : ""}`}
        onLoad={handleLoad}
      />
    </div>
  );
}
