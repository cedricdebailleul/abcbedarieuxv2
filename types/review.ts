export interface Review {
  id: string;
  rating?: number | null;
  comment?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  user: {
    name: string;
  };
}

export interface GoogleReview {
  id: string;
  rating: number;
  comment?: string | null;
  author: string;
  reviewUrl?: string | null;
  createdAt: string; // déjà formaté comme string depuis l'API
}