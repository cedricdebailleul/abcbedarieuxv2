"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/auth/admin-guard";
import { useSession } from "@/hooks/use-session";

interface Claim {
  id: string;
  message: string;
  proof?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  adminMessage?: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  place: {
    id: string;
    name: string;
    slug: string;
    city: string;
    ownerId?: string;
    owner?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface ApiResponse {
  claims: Claim[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    pendingCount: number;
  };
}

function AdminClaimsContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const _placeFilter = searchParams.get("place");

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [pendingCount, setPendingCount] = useState(0);
  const [processingClaim, setProcessingClaim] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/admin/claims?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data: ApiResponse = await response.json();
      setClaims(data.claims);
      setTotalPages(data.pagination.pages);
      setPendingCount(data.stats.pendingCount);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des revendications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchClaims();
    }
  }, [status, session, fetchClaims]);

  const handleProcessClaim = async (
    claimId: string,
    action: "approve" | "reject",
    adminMessage?: string
  ) => {
    try {
      setProcessingClaim(claimId);

      const response = await fetch(`/api/admin/claims/${claimId}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          adminMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors du traitement");
      }

      const result = await response.json();
      toast.success(result.message);
      fetchClaims(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du traitement de la revendication");
    } finally {
      setProcessingClaim(null);
    }
  };

  const showProcessDialog = (claim: Claim, action: "approve" | "reject") => {
    const actionText = action === "approve" ? "Approuver" : "Rejeter";
    const message = prompt(
      `${actionText} la revendication de "${claim.user.name}" pour "${claim.place.name}"?\n\nMessage optionnel pour l'utilisateur:`
    );

    if (message !== null) {
      // null si annulé, string vide si OK sans message
      const confirmText =
        action === "approve"
          ? `Confirmer l'approbation? Cela attribuera la place à ${claim.user.name}.`
          : `Confirmer le rejet?`;

      if (confirm(confirmText)) {
        handleProcessClaim(claim.id, action, message || undefined);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";

    switch (status) {
      case "APPROVED":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "PENDING":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "REJECTED":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
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
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revendications de Places</h1>
          <p className="text-gray-600">Gérez les demandes de revendication des utilisateurs</p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            <span className="font-medium">{pendingCount}</span> revendication
            {pendingCount > 1 ? "s" : ""} en attente
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="PENDING">En attente ({pendingCount})</option>
          <option value="all">Tous les statuts</option>
          <option value="APPROVED">Approuvée</option>
          <option value="REJECTED">Rejetée</option>
        </select>

        <Link
          href="/admin/places"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
        >
          ← Retour aux places
        </Link>
      </div>

      {/* Liste des revendications */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-20 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune revendication trouvée</h3>
          <p className="text-gray-600">
            {statusFilter === "all"
              ? "Aucune revendication dans le système."
              : `Aucune revendication avec le statut "${getStatusText(statusFilter)}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {claim.user.image && (
                      <img
                        src={claim.user.image}
                        alt={claim.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Revendication pour "{claim.place.name}"
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Par {claim.user.name} ({claim.user.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        Place: {claim.place.name} • {claim.place.city}
                      </p>
                      {claim.place.owner && (
                        <p className="text-sm text-gray-500">
                          Propriétaire actuel: {claim.place.owner.name} ({claim.place.owner.email})
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={getStatusBadge(claim.status)}>
                    {getStatusText(claim.status)}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(claim.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Message de revendication:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{claim.message}</p>

                {claim.proof && (
                  <div className="mt-3">
                    <h5 className="font-medium text-gray-900 mb-1">Preuve fournie:</h5>
                    <a
                      href={claim.proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Voir le document/photo
                    </a>
                  </div>
                )}
              </div>

              {claim.status !== "PENDING" && claim.adminMessage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Message admin:</h4>
                  <p className="text-blue-800">{claim.adminMessage}</p>
                  {claim.processedAt && (
                    <p className="text-xs text-blue-600 mt-2">
                      Traité le{" "}
                      {new Date(claim.processedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Link
                    href={`/places/${claim.place.slug}`}
                    target="_blank"
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Voir la place
                  </Link>
                </div>

                {claim.status === "PENDING" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => showProcessDialog(claim, "approve")}
                      disabled={processingClaim === claim.id}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {processingClaim === claim.id ? (
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
                          Traitement...
                        </>
                      ) : (
                        "Approuver"
                      )}
                    </button>
                    <button
                      onClick={() => showProcessDialog(claim, "reject")}
                      disabled={processingClaim === claim.id}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> sur{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Précédent</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === currentPage
                          ? "z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Suivant</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminClaimsPage() {
  return (
    <AdminGuard>
      <AdminClaimsContent />
    </AdminGuard>
  );
}
