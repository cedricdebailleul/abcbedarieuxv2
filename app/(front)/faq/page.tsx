import { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Foire aux questions - ABC Bédarieux",
  description: "Trouvez les réponses aux questions les plus fréquentes sur l'Association Bédaricienne des Commerçants.",
};

const faqData = [
  {
    category: "Général",
    questions: [
      {
        question: "Qu'est-ce que l'Association Bédaricienne des Commerçants ?",
        answer: "L'ABC est une association qui rassemble les commerçants et artisans de Bédarieux pour promouvoir l'activité économique locale, organiser des événements et faciliter les échanges entre professionnels."
      },
      {
        question: "Comment puis-je devenir membre de l'association ?",
        answer: "Pour devenir membre, vous devez être commerçant ou artisan à Bédarieux. Contactez-nous via le formulaire de contact ou rendez-vous directement dans nos locaux. L'adhésion est de 50€ par an."
      },
      {
        question: "Quels sont les avantages d'être membre ?",
        answer: "Les membres bénéficient de : promotion de leur établissement sur notre site, participation aux événements collectifs, réductions sur nos prestations, réseau professionnel, formation et accompagnement."
      }
    ]
  },
  {
    category: "Places et Établissements",
    questions: [
      {
        question: "Comment ajouter mon établissement sur le site ?",
        answer: "Créez un compte et soumettez votre établissement via votre tableau de bord. Notre équipe vérifiera les informations avant publication. C'est gratuit pour les membres de l'association."
      },
      {
        question: "Puis-je modifier les informations de mon établissement ?",
        answer: "Oui, connectez-vous à votre compte et accédez à la gestion de vos établissements. Vous pouvez modifier les horaires, description, photos et coordonnées à tout moment."
      },
      {
        question: "Comment les horaires d'ouverture sont-ils affichés ?",
        answer: "Les horaires sont mis à jour en temps réel. Si votre établissement est fermé exceptionnellement, vous pouvez l'indiquer dans votre tableau de bord."
      }
    ]
  },
  {
    category: "Événements",
    questions: [
      {
        question: "Comment publier un événement ?",
        answer: "Les membres peuvent publier des événements via leur tableau de bord. Les événements sont soumis à modération avant publication pour garantir leur qualité."
      },
      {
        question: "Y a-t-il des frais pour publier un événement ?",
        answer: "La publication d'événements est gratuite pour les membres de l'association. Les non-membres peuvent publier moyennant une participation de 20€."
      },
      {
        question: "Puis-je annuler ou modifier un événement ?",
        answer: "Oui, vous pouvez modifier ou annuler vos événements depuis votre tableau de bord. Les participants inscrits seront automatiquement notifiés des changements."
      }
    ]
  },
  {
    category: "Compte et Inscription",
    questions: [
      {
        question: "L'inscription sur le site est-elle gratuite ?",
        answer: "Oui, l'inscription est gratuite pour tous. Seule l'adhésion à l'association est payante (50€/an) et donne accès aux avantages membres."
      },
      {
        question: "J'ai oublié mon mot de passe, que faire ?",
        answer: "Utilisez le lien 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email pour réinitialiser votre mot de passe."
      },
      {
        question: "Comment supprimer mon compte ?",
        answer: "Contactez-nous par email à contact@abc-bedarieux.fr pour demander la suppression de votre compte. Nous respectons le RGPD et supprimerons toutes vos données."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Foire aux questions</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trouvez rapidement les réponses aux questions les plus fréquentes sur notre association et nos services.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* FAQ Content */}
        <div className="lg:col-span-2 space-y-8">
          {faqData.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-2xl">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, questionIndex) => (
                    <AccordionItem 
                      key={questionIndex} 
                      value={`${categoryIndex}-${questionIndex}`}
                    >
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vous ne trouvez pas la réponse à votre question ? Contactez-nous directement.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">contact@abc-bedarieux.fr</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-sm text-muted-foreground">04 67 95 XX XX</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm text-muted-foreground">
                      Mairie de Bédarieux<br />
                      1 Avenue Abbé Tarroux<br />
                      34600 Bédarieux
                    </p>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href="/contact">
                  Nous contacter
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Devenir membre</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Rejoignez notre communauté de commerçants et bénéficiez de tous nos services.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">
                  S'inscrire
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}