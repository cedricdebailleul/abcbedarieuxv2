"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/admin-guard";
import { PlaceForm } from "@/components/forms/place-form";
import { useSession } from "@/hooks/use-session";

export default function AdminNewPlacePage() {
  const router = useRouter();
  const { data: session } = useSession();

  interface PlaceData {
    name: string;
    type: string;
    street: string;
    postalCode: string;
    city: string;
    createForClaim?: boolean;
    category?: string;
    categories?: string[];
    description?: string;
    summary?: string;
    latitude?: number;
    longitude?: number;
    published?: boolean;
    [key: string]: string | boolean | string[] | number | undefined; // Adjust this type based on expected properties
  }

  const handleSubmit = async (data: PlaceData) => {
    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      if (data.createForClaim) {
        toast.success(
          "Place créée avec succès ! Elle peut maintenant être revendiquée par un utilisateur."
        );
      } else {
        toast.success("Place créée avec succès et vous a été attribuée.");
      }

      // Rediriger vers la liste admin des places
      router.push("/dashboard/admin/places");
    } catch (error: unknown) {
      console.error("Erreur:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Erreur lors de la création de la place");
      } else {
        toast.error("Erreur inconnue lors de la création de la place");
      }
      throw error; // Re-lancer pour que le PlaceForm gère l'état de loading
    }
  };

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Créer une nouvelle place (Admin)
          </h1>
          <p className="text-gray-600 mt-2">
            En tant qu&apos;administrateur, vous pouvez créer des places qui
            vous sont attribuées ou des places &quot;libres&quot; que les
            utilisateurs pourront revendiquer.
          </p>
        </div>

        {/* Informations importantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-6 h-6 text-blue-600 mr-3 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-labelledby="place-icon"
            >
              <title id="place-icon">Icône d&apos;information</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-blue-900 font-medium">
                Options administrateur
              </h3>
              <ul className="text-blue-800 text-sm mt-2 space-y-1">
                <li>
                  • Les places que vous créez sont directement actives (pas de
                  validation)
                </li>
                <li>
                  • Vous pouvez créer des places &quot;pour revendication&quot;
                  qui n&apos;auront pas de propriétaire
                </li>
                <li>
                  • Les utilisateurs pourront ensuite revendiquer ces places
                  libres
                </li>
                <li>
                  • Utilisez la recherche Google pour importer automatiquement
                  les informations
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <PlaceForm
            mode="create"
            onSubmit={handleSubmit}
            userRole={session?.user?.role || "user"}
          />
        </div>
      </div>
    </AdminGuard>
  );
}
