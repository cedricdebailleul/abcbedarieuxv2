"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Heart,
  Award,
  ArrowRight,
  Handshake,
  Star,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const partnerStats = [
  {
    icon: Building2,
    label: "Partenaires institutionnels",
    value: "8+",
    color: "text-blue-600 bg-blue-100",
  },
  {
    icon: Users,
    label: "Partenaires économiques",
    value: "12+",
    color: "text-green-600 bg-green-100",
  },
  {
    icon: Heart,
    label: "Partenaires associatifs",
    value: "15+",
    color: "text-red-600 bg-red-100",
  },
  {
    icon: Award,
    label: "Partenaires premium",
    value: "25+",
    color: "text-purple-600 bg-purple-100",
  },
];

const featuredPartners = [
  {
    name: "Mairie de Bédarieux",
    category: "Institutionnel",
    description: "Partenaire principal pour le développement économique local",
    type: "Collectivité locale",
    collaboration: "Promotion du territoire",
  },
  {
    name: "CCI Hérault",
    category: "Économique",
    description:
      "Accompagnement des entreprises et formation des entrepreneurs",
    type: "Chambre consulaire",
    collaboration: "Formation et conseil",
  },
  {
    name: "Association des Commerçants",
    category: "Associatif",
    description: "Fédération des commerçants pour l'animation du centre-ville",
    type: "Association professionnelle",
    collaboration: "Animation commerciale",
  },
];

const testimonial = {
  content:
    "ABC Bédarieux est devenu un acteur incontournable du développement économique local. Notre collaboration porte ses fruits !",
  author: "Marie Dubois",
  role: "Présidente Association des Commerçants",
  company: "Bédarieux Centre-Ville",
  rating: 5,
};

export function PartnersSection() {
  return (
    <section className="py-16 px-8 ">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4 text-primary border-primary/20"
          >
            <Handshake className="w-4 h-4 mr-2" />
            Écosystème partenaires
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les acteurs qui contribuent avec nous au développement de
            l&apos;économie locale de Bédarieux et ses alentours.
          </p>
        </div>

        {/* Partner Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {partnerStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6 pb-4">
                  <div
                    className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${stat.color}`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Featured Partners */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Nos partenaires clés
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPartners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        {partner.category === "Institutionnel" && (
                          <Building2 className="w-6 h-6 text-primary" />
                        )}
                        {partner.category === "Économique" && (
                          <Users className="w-6 h-6 text-green-600" />
                        )}
                        {partner.category === "Associatif" && (
                          <Heart className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Badge
                          variant="outline"
                          className={`mb-2 ${
                            partner.category === "Institutionnel"
                              ? "text-primary border-primary/20"
                              : partner.category === "Économique"
                                ? "text-green-600 border-green-200"
                                : "text-red-600 border-red-200"
                          }`}
                        >
                          {partner.category}
                        </Badge>
                        <CardTitle className="text-lg text-gray-900 mb-2">
                          {partner.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {partner.description}
                    </p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>
                          <strong>Type:</strong> {partner.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>
                          <strong>Collaboration:</strong>{" "}
                          {partner.collaboration}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-1 mb-4 justify-center">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-500 fill-current"
                  />
                ))}
              </div>
              <blockquote className="text-lg text-gray-700 italic text-center mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.author}
                  </h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-xs text-gray-500">{testimonial.company}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Vous souhaitez devenir partenaire ?
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Rejoignez notre écosystème de partenaires et contribuez ensemble
              au développement économique local. Découvrez nos opportunités de
              collaboration.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/partenaires">
                  <MapPin className="w-5 h-5 mr-2" />
                  Découvrir nos partenaires
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">
                  Devenir partenaire
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
