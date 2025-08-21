import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  getPublicCategoriesAction,
  getPublicPostsAction,
  getPublicTagsAction,
} from "@/actions/post";
import { PostCard } from "@/components/posts/post-card";
import { PublicPostsFilters } from "@/components/posts/public-posts-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type PostFilters, postFiltersSchema } from "@/lib/validations/post";

// Composant de chargement pour les articles
function PostsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="size-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Composant de chargement pour les filtres
function FiltersLoading() {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant de pagination
function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `/articles?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      {/* Page précédente */}
      {currentPage > 1 && (
        <Button variant="outline" size="sm" asChild>
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft className="size-4 mr-1" />
            Précédent
          </Link>
        </Button>
      )}

      {/* Numéros de page */}
      <div className="flex items-center space-x-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            // Afficher les 3 premières, 3 dernières, et 2 autour de la page courante
            return (
              page <= 3 ||
              page >= totalPages - 2 ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            );
          })
          .map((page, index, array) => {
            const prevPage = array[index - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <div key={page} className="flex items-center">
                {showEllipsis && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  asChild
                >
                  <Link href={createPageUrl(page)}>{page}</Link>
                </Button>
              </div>
            );
          })}
      </div>

      {/* Page suivante */}
      {currentPage < totalPages && (
        <Button variant="outline" size="sm" asChild>
          <Link href={createPageUrl(currentPage + 1)}>
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  );
}

interface ArticlesPageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    tagId?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}
export default async function ArticlesPage({
  searchParams: searchParamsPromise,
}: ArticlesPageProps) {
  const searchParams = await searchParamsPromise;
  const currentPage = parseInt(searchParams.page || "1");

  // Valider et caster les searchParams pour correspondre à PostFilters
  const validatedSearchParams = postFiltersSchema
    .partial()
    .parse(searchParams) as Partial<PostFilters>;

  // Récupérer les données en parallèle
  const [postsResult, categoriesResult, tagsResult] = await Promise.all([
    getPublicPostsAction({
      ...validatedSearchParams,
      page: currentPage,
      limit: 12,
    }),
    getPublicCategoriesAction(),
    getPublicTagsAction(),
  ]);

  const posts = postsResult.success
    ? postsResult.data!.posts.map((post) => ({
        ...post,
        published: true, // Default value for missing property
        createdAt: new Date(), // Default value for missing property
        category: post.category
          ? { ...post.category, slug: post.category.slug || "default-slug" }
          : null, // Ensure category includes slug or is null
      }))
    : [];
  const total = postsResult.success ? postsResult.data!.total : 0;
  const totalPages = postsResult.success ? postsResult.data!.pages : 0;
  const categories = categoriesResult.success ? categoriesResult.data! : [];
  const tags = tagsResult.success ? tagsResult.data! : [];

  return (
    <div className="mx-auto py-8">
      {/* En-tête */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Tous les articles</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Découvrez tous nos articles sur ABC Bédarieux. Utilisez les filtres
          pour trouver exactement ce que vous cherchez.
        </p>
      </div>

      <div className="grid md:grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <Suspense fallback={<FiltersLoading />}>
            <PublicPostsFilters categories={categories} tags={tags} />
          </Suspense>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          {/* Résultats et tri */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>
                {total > 0 ? (
                  <>
                    {total} article{total > 1 ? "s" : ""} trouvé
                    {total > 1 ? "s" : ""}
                    {currentPage > 1 && (
                      <>
                        {" "}
                        (page {currentPage} sur {totalPages})
                      </>
                    )}
                  </>
                ) : (
                  "Aucun article trouvé"
                )}
              </span>
            </div>

            {/* Indicateur de filtre actif */}
            {(searchParams.search ||
              searchParams.categoryId ||
              searchParams.tagId) && (
              <div className="flex items-center space-x-1 text-xs">
                <Filter className="h-3 w-3" />
                <span className="text-muted-foreground">Filtres actifs</span>
              </div>
            )}
          </div>

          {/* Liste des articles */}
          <Suspense fallback={<PostsLoading />}>
            {posts.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchParams={searchParams}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Aucun article trouvé
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {searchParams.search ||
                    searchParams.categoryId ||
                    searchParams.tagId
                      ? "Aucun article ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                      : "Aucun article n'a encore été publié. Revenez bientôt pour découvrir nos contenus !"}
                  </p>
                  {(searchParams.search ||
                    searchParams.categoryId ||
                    searchParams.tagId) && (
                    <Button variant="outline" asChild>
                      <Link href="/articles">Voir tous les articles</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Métadonnées pour SEO
export const metadata = {
  title: "Tous les articles - ABC Bédarieux",
  description:
    "Découvrez tous nos articles sur ABC Bédarieux. Actualités, guides, conseils et bien plus encore.",
  openGraph: {
    title: "Tous les articles - ABC Bédarieux",
    description:
      "Découvrez tous nos articles sur ABC Bédarieux. Actualités, guides, conseils et bien plus encore.",
  },
};
