"use client";

import { useEffect } from "react";

interface TrackViewProps {
  type: "place" | "event";
  slug: string;
}

export function TrackView({ type, slug }: TrackViewProps) {
  useEffect(() => {
    fetch(`/api/${type}s/${slug}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Silently ignore — tracking must never break the user experience
    });
  }, [type, slug]);

  return null;
}
