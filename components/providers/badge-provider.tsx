"use client";

import { BadgeCelebration } from "@/components/ui/badge-celebration";
import { useBadgeCelebration } from "@/hooks/use-badge-celebration";

export function BadgeProvider() {
  const { isOpen, badge, reason, closeBadge } = useBadgeCelebration();

  if (!badge) return null;

  return (
    <BadgeCelebration
      isOpen={isOpen}
      onClose={closeBadge}
      badge={badge}
      reason={reason}
    />
  );
}