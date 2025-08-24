import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  profile?: {
    firstname?: string;
    lastname?: string;
    phone?: string;
  };
}

interface Session {
  state: string;
  user: User;
}

interface UseSessionReturn {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData?.user) {
            setSession(sessionData);
            setStatus("authenticated");
          } else {
            setSession(null);
            setStatus("unauthenticated");
          }
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
        setSession(null);
        setStatus("unauthenticated");
      }
    };

    fetchSession();
  }, []);

  return { data: session, status };
}
