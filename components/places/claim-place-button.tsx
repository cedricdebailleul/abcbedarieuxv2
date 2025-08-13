"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

interface ClaimPlaceButtonProps {
  placeId: string;
  placeName: string;
  hasOwner: boolean;
}

interface ClaimStatus {
  canClaim: boolean;
  isOwner: boolean;
  claims: {
    id: string;
    status: string;
    message: string;
    createdAt: string;
    adminMessage?: string;
  }[];
}

export function ClaimPlaceButton({ placeId, placeName, hasOwner }: ClaimPlaceButtonProps) {
  const { data: session, status } = useSession();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchClaimStatus();
    }
  }, [status, fetchClaimStatus]);

  const fetchClaimStatus = async () => {
    try {
      const response = await fetch(`/api/places/${placeId}/claim`);
      if (response.ok) {
        const data = await response.json();
        setClaimStatus(data);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut:", error);
    }
  };

  const handleClaim = async () => {
    if (!claimMessage.trim()) {
      toast.error("Veuillez expliquer pourquoi vous revendiquez cette place");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/places/${placeId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: claimMessage,
          proof: proofUrl || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la revendication");
      }

      const result = await response.json();
      toast.success(result.message);
      setShowClaimForm(false);
      setClaimMessage("");
      setProofUrl("");
      fetchClaimStatus(); // Recharger le statut
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la revendication");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approuvée";
      case "PENDING":
        return "En attente";
      case "REJECTED":
        return "Rejetée";
      default:
        return status;
    }
  };

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <a href="/login" className="font-medium underline">
            Connectez-vous
          </a>{" "}
          pour revendiquer cette place si elle vous appartient.
        </p>
      </div>
    );
  }

  if (!claimStatus) {
    return null;
  }

  // Si l'utilisateur est déjà propriétaire
  if (claimStatus.isOwner) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-green-800 font-medium">
            Vous êtes le propriétaire de cette place
          </span>
        </div>
      </div>
    );
  }

  // Si l'utilisateur a déjà fait une demande
  if (claimStatus.claims.length > 0) {
    const latestClaim = claimStatus.claims[0];

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Votre demande de revendication</h3>

        <div className="mb-3">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(latestClaim.status)}`}
          >
            {getStatusText(latestClaim.status)}
          </span>
          <span className="text-sm text-gray-500 ml-2">
            {new Date(latestClaim.createdAt).toLocaleDateString("fr-FR")}
          </span>
        </div>

        <p className="text-sm text-gray-700 mb-3">"{latestClaim.message}"</p>

        {latestClaim.adminMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Message admin:</span> {latestClaim.adminMessage}
            </p>
          </div>
        )}

        {latestClaim.status === "REJECTED" && (
          <button
            onClick={() => setShowClaimForm(true)}
            className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Faire une nouvelle demande
          </button>
        )}
      </div>
    );
  }

  // Si la place a déjà un propriétaire et qu'on ne peut pas revendiquer
  if (hasOwner && !claimStatus.canClaim) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-700 text-sm">Cette place a déjà un propriétaire vérifié.</p>
      </div>
    );
  }

  // Formulaire de revendication
  if (showClaimForm) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Revendiquer "{placeName}"</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pourquoi cette place vous appartient-elle ? *
            </label>
            <textarea
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Expliquez pourquoi vous êtes le propriétaire légitime de cette place. Soyez précis et détaillé."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preuve (optionnel)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://... (lien vers document, photo, etc.)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vous pouvez fournir un lien vers un document prouvant votre propriété
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-yellow-800">
                  Votre demande sera examinée par un administrateur. Vous recevrez un email avec la
                  décision.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClaim}
              disabled={loading || !claimMessage.trim()}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                "Envoyer la demande"
              )}
            </button>
            <button
              onClick={() => {
                setShowClaimForm(false);
                setClaimMessage("");
                setProofUrl("");
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bouton pour ouvrir le formulaire de revendication
  if (claimStatus.canClaim) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">Cette place vous appartient ?</h3>
            <p className="text-sm text-blue-800">
              Revendiquez-la pour la gérer et recevoir les avis clients.
            </p>
          </div>
          <button
            onClick={() => setShowClaimForm(true)}
            className="ml-4 inline-flex items-center px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Revendiquer
          </button>
        </div>
      </div>
    );
  }

  return null;
}
