import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  Users,
  FileText,
  Lightbulb,
  Search,
  Shield,
  Zap,
  Heart
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aide & Support - ABC Bédarieux",
  description: "Besoin d'aide ? Découvrez notre centre de support avec FAQ, guides et moyens de contact pour résoudre vos questions rapidement.",
};

const supportChannels = [
  {
    icon: Mail,
    title: "Support par email",
    description: "Contactez-nous par email pour toute question détaillée",
    action: "Nous écrire",
    href: "/contact",
    responseTime: "Réponse sous 24h",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: Phone,
    title: "Support téléphonique",
    description: "Appelez-nous pour une assistance immédiate",
    action: "Nous appeler",
    href: "tel:+33467950000",
    responseTime: "Lun-Ven 9h-17h",
    color: "bg-green-100 text-green-600"
  },
  {
    icon: HelpCircle,
    title: "Chat en ligne",
    description: "Discutez directement avec notre équipe",
    action: "Démarrer le chat",
    href: "/contact",
    responseTime: "Disponible maintenant",
    color: "bg-purple-100 text-purple-600"
  }
];

const quickHelp = [
  {
    icon: Search,
    title: "Comment référencer mon établissement ?",
    description: "Guide complet pour créer votre fiche établissement sur ABC Bédarieux",
    href: "/faq"
  },
  {
    icon: Users,
    title: "Gestion de mon profil",
    description: "Modifier vos informations, horaires et photos d'établissement",
    href: "/faq"
  },
  {
    icon: FileText,
    title: "Créer un événement",
    description: "Promouvoir vos événements et animations auprès de la communauté",
    href: "/faq"
  },
  {
    icon: Shield,
    title: "Confidentialité des données",
    description: "Comment nous protégeons vos informations personnelles",
    href: "/privacy2"
  }
];

const resources = [
  {
    icon: FileText,
    title: "Guides d'utilisation",
    description: "Documentation complète pour utiliser toutes les fonctionnalités",
    badge: "Nouveauté"
  },
  {
    icon: Lightbulb,
    title: "Conseils et astuces",
    description: "Optimisez votre présence locale avec nos recommandations",
    badge: "Populaire"
  },
  {
    icon: Zap,
    title: "Mises à jour",
    description: "Restez informé des dernières fonctionnalités et améliorations",
    badge: "Important"
  },
  {
    icon: Heart,
    title: "Success stories",
    description: "Découvrez comment d'autres établissements utilisent ABC Bédarieux",
    badge: "Inspirant"
  }
];

const faqItems = [
  {
    question: "Comment puis-je référencer mon établissement ?",
    answer: "Pour référencer votre établissement, contactez-nous via notre formulaire de contact. Notre équipe vous accompagnera dans la création de votre fiche gratuite."
  },
  {
    question: "Le référencement est-il gratuit ?",
    answer: "Oui ! Le référencement de base de votre établissement est entièrement gratuit et inclut vos informations de contact, horaires et localisation."
  },
  {
    question: "Comment modifier mes informations ?",
    answer: "Contactez notre équipe support qui se chargera de mettre à jour vos informations. Nous travaillons sur une interface de gestion autonome."
  },
  {
    question: "Puis-je ajouter des photos ?",
    answer: "Absolument ! Vous pouvez nous envoyer jusqu'à 10 photos de votre établissement que nous ajouterons à votre fiche."
  },
  {
    question: "Comment promouvoir mes événements ?",
    answer: "Informez-nous de vos événements via notre formulaire de contact. Nous les ajouterons gratuitement à votre fiche et au calendrier local."
  }
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-primary border-primary/20">
            Centre d&apos;aide
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Trouvez rapidement les réponses à vos questions ou contactez directement notre équipe support.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Nous contacter</Link>
          </Button>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contactez notre support
            </h2>
            <p className="text-lg text-gray-600">
              Choisissez le canal qui vous convient le mieux
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {supportChannels.map((channel) => (
              <Card key={channel.title} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${channel.color}`}>
                    <channel.icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{channel.title}</CardTitle>
                  <p className="text-gray-600 mt-2">{channel.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {channel.responseTime}
                    </Badge>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={channel.href}>{channel.action}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Help */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Aide rapide
            </h2>
            <p className="text-lg text-gray-600">
              Les questions les plus fréquentes et leurs réponses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quickHelp.map((item) => (
              <Card key={item.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 mb-2">
                        {item.title}
                      </CardTitle>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={item.href}>En savoir plus</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ressources utiles
            </h2>
            <p className="text-lg text-gray-600">
              Découvrez nos guides et conseils pour optimiser votre expérience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {resources.map((resource) => (
              <Card key={resource.title} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 flex items-center justify-center">
                      <resource.icon className="w-8 h-8 text-secondary" />
                    </div>
                    {resource.badge && (
                      <Badge 
                        variant="outline" 
                        className="absolute -top-2 -right-2 text-xs"
                      >
                        {resource.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg text-gray-900">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{resource.description}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/contact">Accéder</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-lg text-gray-600">
              Trouvez rapidement les réponses aux questions les plus courantes
            </p>
          </div>

          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    {item.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed pl-8">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Vous n&apos;avez pas trouvé votre réponse ?</p>
            <Button asChild>
              <Link href="/faq">Voir toutes les FAQ</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Toujours besoin d&apos;aide ?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Notre équipe est là pour vous accompagner dans votre utilisation d&apos;ABC Bédarieux.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">Contacter le support</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/faq">Consulter la FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}