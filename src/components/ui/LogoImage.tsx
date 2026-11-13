"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Official logo image with a typographic fallback, so a missing or blocked
 * asset never shows a broken-image icon. `variant` controls which theme the
 * file is shown in (one file for both, or separate light/dark files).
 */
export function LogoImage({
  src,
  alt,
  width,
  height,
  fallback,
  className = "",
  variant = "both",
  style,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  fallback: string;
  className?: string;
  variant?: "both" | "light" | "dark";
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const themeClass = variant === "light" ? "only-light" : variant === "dark" ? "only-dark" : "";
  if (failed) {
    return (
      <span className={`${themeClass} inline-flex items-center text-[1.05rem] font-semibold tracking-[-0.03em] text-fg`} role="img" aria-label={alt}>
        {fallback}
      </span>
    );
  }
  return <Image src={src} alt={alt} width={width} height={height} className={`${themeClass} ${className}`} style={style} onError={() => setFailed(true)} />;
}
