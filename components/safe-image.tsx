"use client";

import Image from "next/image";
import { useState } from "react";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  unoptimized?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  fallbackClassName?: string;
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function isDataUrl(url: string) {
  return /^data:/i.test(url);
}

export function SafeImage({
  src,
  alt,
  fill,
  className,
  unoptimized,
  sizes,
  width,
  height,
  fallbackClassName = "w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs",
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  // Logs pour debugging
  console.log(`[SafeImage] Tentative de chargement:`, {
    src,
    alt,
    hasError,
    isEmpty: !src || src.trim() === "",
    fullSrc: src ? (src.startsWith('/') ? src : `/${src}`) : 'null'
  });

  // Si src est vide ou invalide, afficher directement le fallback
  if (!src || src.trim() === "" || hasError) {
    console.log(`[SafeImage] Fallback activé pour:`, { src, hasError });
    return <div className={fallbackClassName}>Image non disponible</div>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      unoptimized={unoptimized ?? (isExternal(src) || isDataUrl(src))}
      sizes={sizes}
      onError={(e) => {
        console.log(`[SafeImage] ERREUR de chargement:`, {
          src,
          alt,
          error: e.currentTarget.src,
          naturalWidth: e.currentTarget.naturalWidth,
          naturalHeight: e.currentTarget.naturalHeight
        });
        setHasError(true);
      }}
    />
  );
}
