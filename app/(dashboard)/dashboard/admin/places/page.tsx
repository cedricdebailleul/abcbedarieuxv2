"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { AdminGuard } from "@/components/auth/admin-guard";
import Link from "next/link";
import { toast } from "sonner";

interface Place {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  city: string;
  street: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    reviews: number;
    favorites: number;
    claims: number;
  };
}

interface ApiResponse {
  places: Place[];
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

function AdminPlacesContent() {
  const { data: session, status } = useSession();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/admin/places?${params}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data: ApiResponse = await response.json();
      setPlaces(data.places);
      setTotalPages(data.pagination.pages);
      setPendingCount(data.stats.pendingCount);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchPlaces();
    }
  }, [status, session, currentPage, statusFilter, searchQuery]);

  const handleValidation = async (
    placeId: string,
    action: "approve" | "reject",
    placeName: string
  ) => {
    const confirmMessage =
      action === "approve"
        ? `Approuver la place "${placeName}" ?`
        : `Rejeter la place "${placeName}" ?`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/admin/places/${placeId}/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la validation");
      }

      const result = await response.json();
      toast.success(result.message);
      fetchPlaces(); // Recharger la liste
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la validation");
    }
  };

  const getStatusBadge = (status: string, isVerified: boolean) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";

    switch (status) {
      case "ACTIVE":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "PENDING":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "DRAFT":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case "INACTIVE":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Actif";
      case "PENDING":
        return "En attente";
      case "DRAFT":
        return "Brouillon";
      case "INACTIVE":
        return "Inactif";
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
          <h1 className="text-3xl font-bold text-gray-900">
            Administration des Places
          </h1>
          <p className="text-gray-600">
            Gérez et validez les places du répertoire
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            <span className="font-medium">{pendingCount}</span> place
            {pendingCount > 1 ? "s" : ""} en attente
          </div>
        )}
      </div>

      {/* Filtres et recherche */}
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
          <option value="ACTIVE">Actif</option>
          <option value="DRAFT">Brouillon</option>
          <option value="INACTIVE">Inactif</option>
        </select>

        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher par nom, ville ou propriétaire..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Liste des places */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
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
      ) : places.length === 0 ? (
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Aucune place trouvée
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? "Aucun résultat pour cette recherche."
              : statusFilter === "all"
              ? "Aucune place dans le système."
              : `Aucune place avec le statut "${getStatusText(statusFilter)}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {places.map((place) => (
              <div key={place.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {place.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {place.type} • {place.city}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          {place.street}
                        </p>

                        {place.owner && (
                          <p className="text-sm text-gray-500">
                            Propriétaire: {place.owner.name} (
                            {place.owner.email})
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{place._count.reviews} avis</span>
                          <span>{place._count.favorites} favoris</span>
                          {place._count.claims > 0 && (
                            <span className="text-orange-600 font-medium">
                              {place._count.claims} revendication
                              {place._count.claims > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={getStatusBadge(
                            place.status,
                            place.isVerified
                          )}
                        >
                          {getStatusText(place.status)}
                        </span>
                        <p className="text-xs text-gray-500 mt-2">
                          Créé le{" "}
                          {new Date(place.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    <Link
                      href={`/places/${place.slug}`}
                      target="_blank"
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Voir
                    </Link>
                    <Link
                      href={`/dashboard/places/${place.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      Modifier
                    </Link>
                    {place._count.claims > 0 && (
                      <Link
                        href={`/dashboard/admin/claims?place=${place.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md transition-colors"
                      >
                        Voir revendications
                      </Link>
                    )}
                  </div>

                  {place.status === "PENDING" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleValidation(place.id, "approve", place.name)
                        }
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() =>
                          handleValidation(place.id, "reject", place.name)
                        }
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
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
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {Math.min(5, totalPages) === totalPages ? (
                  [...Array(totalPages)]
                    .map((_, i) => i + 1)
                    .map((page) => (
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
                    ))
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === 1
                          ? "z-10 bg-blue-600 text-white"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      1
                    </button>
                    {currentPage > 3 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                        ...
                      </span>
                    )}
                    {currentPage > 2 && currentPage < totalPages - 1 && (
                      <button
                        onClick={() => setCurrentPage(currentPage)}
                        className="z-10 bg-blue-600 text-white relative inline-flex items-center px-4 py-2 text-sm font-semibold"
                      >
                        {currentPage}
                      </button>
                    )}
                    {currentPage < totalPages - 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === totalPages
                          ? "z-10 bg-blue-600 text-white"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Suivant</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
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

export default function AdminPlacesPage() {
  return (
    <AdminGuard>
      <AdminPlacesContent />
    </AdminGuard>
  );
}
