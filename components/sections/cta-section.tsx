"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrationDialog } from "@/components/abc/registration-dialog";
import { ArrowRight, Users, Heart, Star } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container mx-auto px-4">
        <Card className="overflow-hidden border-2 border-primary/20 shadow-xl p-6">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Contenu textuel */}
              <div className="p-8 lg:p-12">
                <div className="max-w-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Rejoignez plus de 200 membres
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold mb-4">
                    Rejoignez l&apos;Association ABC Bédarieux
                  </h2>

                  <p className="text-lg text-muted-foreground mb-6">
                    Soutenez le commerce local et l&apos;artisanat bédaricien.
                    Participez à nos événements, bénéficiez d&apos;avantages
                    exclusifs et contribuez au dynamisme de notre ville.
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">
                        Accès aux événements exclusifs
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">
                        Réductions chez nos partenaires
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">
                        Newsletter avec les actualités locales
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">
                        Networking avec les commerçants locaux
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <RegistrationDialog size="lg" className="flex-1">
                      <Button size="lg" className="w-1/2 xl:w-full group">
                        Adhérer maintenant
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </RegistrationDialog>

                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="flex-1"
                    >
                      <a href="/contact">En savoir plus</a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section visuelle */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center size-24 bg-primary/10  mb-6">
                    <Users className="size-12 text-primary" />
                  </div>

                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        200+
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Membres actifs
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">50+</div>
                        <div className="text-xs text-muted-foreground">
                          Commerçants
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">25+</div>
                        <div className="text-xs text-muted-foreground">
                          Événements/an
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                      <span className="text-sm text-muted-foreground">
                        Soutien local depuis 2010
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
