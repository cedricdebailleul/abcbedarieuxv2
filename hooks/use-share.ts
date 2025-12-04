"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export function useShare() {
  const [isSharing, setIsSharing] = useState(false);

  const share = async (data: ShareData) => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(data.url || window.location.href);
        toast.success("Lien copié dans le presse-papier");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
        toast.error("Erreur lors du partage");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return { share, isSharing };
}
