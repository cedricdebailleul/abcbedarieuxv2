"use client";

import { useEffect, useState } from "react";
import { useSession } from "./use-session";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  profile?: {
    firstname?: string;
    lastname?: string;
    phone?: string;
    address?: string;
  };
}

interface UseUserProfileReturn {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useUserProfile(): UseUserProfileReturn {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === "loading") return;
      
      if (status === "unauthenticated" || !session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/profile", {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
          setError(null);
        } else {
          // Fallback aux données de session de base
          setUser(session.user);
          setError(null);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du profil:", err);
        // Fallback aux données de session de base
        setUser(session.user);
        setError("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, status]);

  return { user, loading, error };
}