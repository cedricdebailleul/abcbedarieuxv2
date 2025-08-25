"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PartnersTable } from "./_components/partners-table";
import { PartnersFilters } from "./_components/partners-filters";
import { PartnersStats } from "./_components/partners-stats";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Partner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  partnerType: string;
  category?: string;
  priority: number;
  isActive: boolean;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  partners: Partner[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  stats: Record<string, number>;
}

interface FiltersState {
  search: string;
  type: string;
  isActive: string;
  sortBy: string;
  sortOrder: string;
}

export function PartnersContent() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    type: "all",
    isActive: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchPartners = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search: filters.search,
          type: filters.type,
          isActive: filters.isActive,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        const response = await fetch(`/api/admin/partners?${searchParams}`);

        if (!response.ok) {
          throw new Error("Erreur lors du chargement");
        }

        const data: ApiResponse = await response.json();
        setPartners(data.partners);
        setPagination(data.pagination);
        setStats(data.stats);
      } catch (error) {
        toast.error("Erreur lors du chargement des partenaires");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, filters]
  );

  useEffect(() => {
    fetchPartners(1);
  }, [fetchPartners]);

  const handlePageChange = (page: number) => {
    fetchPartners(page);
  };

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Partenaire supprimé avec succès");
      fetchPartners(pagination.currentPage);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification");
      }

      fetchPartners(pagination.currentPage);
    } catch (error) {
      toast.error("Erreur lors de la modification du statut");
      throw error;
    }
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFeatured }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification");
      }

      fetchPartners(pagination.currentPage);
    } catch (error) {
      toast.error("Erreur lors de la modification de la mise en avant");
      throw error;
    }
  };

  // Calculs pour les statistiques
  const totalPartners = pagination.totalCount;
  const activePartners = partners.filter((p) => p.isActive).length;
  const featuredPartners = partners.filter((p) => p.isFeatured).length;

  // Génération des numéros de page pour la pagination
  const generatePageNumbers = () => {
    const pages = [];
    const { currentPage, totalPages } = pagination;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "ellipsis",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages
        );
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <PartnersStats
        totalPartners={totalPartners}
        activePartners={activePartners}
        featuredPartners={featuredPartners}
        partnersByType={stats}
      />

      {/* Actions principales */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Partenaires</h2>
          <p className="text-muted-foreground">
            {totalPartners} partenaire{totalPartners > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/partners/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau partenaire
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <PartnersFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            stats={stats}
          />
        </CardContent>
      </Card>

      {/* Table des partenaires */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <PartnersTable
              partners={partners}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onToggleFeatured={handleToggleFeatured}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className={
                    pagination.currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {generatePageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => handlePageChange(page as number)}
                      isActive={page === pagination.currentPage}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className={
                    pagination.currentPage === pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
