// Exports centralisés de tous les types
export * from "./badge";

// Types communs pour les actions
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Types pour la pagination
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Types pour les filtres communs
export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}