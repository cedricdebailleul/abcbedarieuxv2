"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Action {
  id: string;
  title: string;
  slug: string;
  description?: string;
  summary?: string;
  coverImage?: string;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  publishedAt?: string;
  createdAt: string;
}

interface ActionsSectionProps {
  limit?: number;
  featuredOnly?: boolean;
  layout?: "grid" | "columns";
  title?: string;
  description?: string;
}

export function ActionsSection({
  limit = 6,
  featuredOnly = false,
  layout = "grid",
  title = "Nos Actions",
  description = "Découvrez les initiatives et projets que nous menons pour dynamiser Bédarieux et soutenir nos commerçants locaux",
}: ActionsSectionProps) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
        });

        if (featuredOnly) {
          params.append("featured", "true");
        }

        const response = await fetch(`/api/actions?${params}`);
        if (!response.ok) {
          console.warn("API actions non disponible:", response.status);
          setActions([]);
          return;
        }

        const data = await response.json();
        setActions(data.actions || []);
      } catch (error) {
        console.warn("Erreur lors du chargement des actions:", error);
        setActions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [limit, featuredOnly]);

  if (loading) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded animate-pulse mb-4" />
            <div className="h-4 bg-muted rounded animate-pulse max-w-md mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {layout === "columns" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                variant="horizontal"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {actions.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        )}

        {!featuredOnly && actions.length === limit && (
          <div className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/actions">
                Voir toutes nos actions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function ActionCard({
  action,
  variant = "vertical",
}: {
  action: Action;
  variant?: "vertical" | "horizontal";
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (variant === "horizontal") {
    return (
      <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
          {action.coverImage && (
            <div className="md:col-span-2 relative overflow-hidden">
              <Image
                src={action.coverImage}
                alt={action.title}
                className="w-full md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                fill
              />
              {action.isFeatured && (
                <Badge className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 border-yellow-400">
                  <Star className="size-3 mr-1" />
                  En avant
                </Badge>
              )}
            </div>
          )}

          <CardContent
            className={`p-6 flex flex-col justify-between ${
              action.coverImage ? "md:col-span-3" : "md:col-span-5"
            }`}
          >
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                {action.summary ? (
                  <p className="text-muted-foreground line-clamp-3">
                    {action.summary}
                  </p>
                ) : action.description ? (
                  <p className="text-muted-foreground line-clamp-3">
                    {action.description}
                  </p>
                ) : null}
              </div>

              {(action.startDate || action.endDate) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {action.startDate && action.endDate ? (
                    <span>
                      Du {formatDate(action.startDate)} au{" "}
                      {formatDate(action.endDate)}
                    </span>
                  ) : action.startDate ? (
                    <span>À partir du {formatDate(action.startDate)}</span>
                  ) : action.endDate ? (
                    <span>Jusqu&apos;au {formatDate(action.endDate)}</span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/actions/${action.slug}`}>
                  En savoir plus
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {action.coverImage && (
        <div className="relative overflow-hidden">
          <Image
            src={action.coverImage}
            alt={action.title}
            className="w-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-2xl"
            fill
          />
          {action.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 border-yellow-400">
              <Star className="h-3 w-3 mr-1" />
              En avant
            </Badge>
          )}
        </div>
      )}

      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
              {action.title}
            </h3>
            {action.summary ? (
              <p className="text-muted-foreground line-clamp-3">
                {action.summary}
              </p>
            ) : action.description ? (
              <p className="text-muted-foreground line-clamp-3">
                {action.description}
              </p>
            ) : null}
          </div>

          {(action.startDate || action.endDate) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="size-4 mr-2" />
              {action.startDate && action.endDate ? (
                <span>
                  Du {formatDate(action.startDate)} au{" "}
                  {formatDate(action.endDate)}
                </span>
              ) : action.startDate ? (
                <span>À partir du {formatDate(action.startDate)}</span>
              ) : action.endDate ? (
                <span>Jusqu&apos;au {formatDate(action.endDate)}</span>
              ) : null}
            </div>
          )}

          <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/actions/${action.slug}`}>
                En savoir plus
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
