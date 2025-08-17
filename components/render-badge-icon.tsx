// icons.tsx
"use client";

import * as React from "react";
import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";

type AnyIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Fallback si le nom fourni n’existe pas
const ICON_FALLBACK = "Tag";

// Petit helper qui récupère un composant d’icône **et le cast** proprement
function getLucideIcon(name?: string): AnyIcon {
  const key = (
    name && name in Lucide ? name : ICON_FALLBACK
  ) as keyof typeof Lucide;
  return Lucide[key] as unknown as AnyIcon; // on force le type vers un composant valide
}

type IconSize = "xs" | "sm" | "md" | "lg";

const ICON_SIZES: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const WRAPPER_SIZES: Record<IconSize, string> = {
  xs: "w-4 h-4",
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-7 h-7",
};

export function BadgeIcon({
  name,
  color,
  size = "xs",
  className,
  strokeWidth = 1.75,
}: {
  name?: string | null;
  color?: string | null;
  size?: IconSize;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = getLucideIcon(name ?? undefined);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${WRAPPER_SIZES[size]}`}
      aria-hidden="true"
    >
      <Icon
        className={`shrink-0 ${ICON_SIZES[size]} ${className ?? ""}`}
        style={{ color: color ?? undefined }}
        strokeWidth={strokeWidth}
        focusable="false"
      />
    </span>
  );
}

export function renderCategoryIcon(
  name?: string | null,
  color?: string | null,
  extraClasses?: string,
  size: IconSize = "xs",
  strokeWidth = 1.75
) {
  return (
    <BadgeIcon
      name={name ?? undefined}
      color={color ?? undefined}
      size={size}
      strokeWidth={strokeWidth}
      className={extraClasses}
    />
  );
}
