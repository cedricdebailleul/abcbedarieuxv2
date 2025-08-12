"use client";

import { useRouter } from "next/navigation";
import { PlaceForm } from "@/components/forms/place-form";
import { toast } from "sonner";

export default function NewPlacePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
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

      const result = await response.json();

      toast.success(
        "Place créée avec succès! Elle sera vérifiée par un administrateur."
      );

      // Rediriger vers la liste des places
      router.push("/dashboard/places");
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la création de la place");
      throw error; // Re-lancer pour que le PlaceForm gère l'état de loading
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Créer une nouvelle place
        </h1>
        <p className="text-gray-600 mt-2">
          Ajoutez votre établissement au répertoire local. Votre place sera
          vérifiée par un administrateur avant publication.
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
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-blue-900 font-medium">À savoir</h3>
            <ul className="text-blue-800 text-sm mt-2 space-y-1">
              <li>
                • Votre place sera en attente de validation après création
              </li>
              <li>• Vous recevrez un email une fois la validation effectuée</li>
              <li>
                • Utilisez la recherche Google pour importer automatiquement les
                informations
              </li>
              <li>• Tous les champs marqués d'un * sont obligatoires</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PlaceForm mode="create" onSubmit={handleSubmit} userRole="user" />
      </div>
    </div>
  );
}
