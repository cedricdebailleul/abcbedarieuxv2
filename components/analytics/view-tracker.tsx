"use client";

import { useEffect, useRef } from 'react';

interface ViewTrackerProps {
  postId: string;
  threshold?: number; // Temps en millisecondes avant d'enregistrer la vue
}

export function ViewTracker({ postId, threshold = 3000 }: ViewTrackerProps) {
  const hasTracked = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Éviter les vues multiples sur la même page
    if (hasTracked.current) return;

    const trackView = async () => {
      try {
        await fetch(`/api/posts/${postId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        hasTracked.current = true;
      } catch (error) {
        console.error('Erreur lors du tracking de vue:', error);
      }
    };

    // Observer pour détecter si l'article est visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // L'article est visible, attendre le threshold avant de tracker
            timeoutRef.current = setTimeout(trackView, threshold);
          } else {
            // L'article n'est plus visible, annuler le tracking si pas encore fait
            if (timeoutRef.current && !hasTracked.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }
        });
      },
      {
        threshold: 0.5, // Au moins 50% de l'article doit être visible
        rootMargin: '0px'
      }
    );

    // Observer le document
    observer.observe(document.documentElement);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [postId, threshold]);

  // Ce composant ne rend rien visuellement
  return null;
}