import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Clock, Users, Briefcase, MapPin } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "Contact - ABC Bédarieux",
  description:
    "Contactez l'Association Bédaricienne des Commerçants. Nous sommes à votre écoute pour toutes vos questions.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Nous contacter</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          L&apos;équipe de l&apos;Association Bédaricienne des Commerçants est à
          votre écoute pour répondre à toutes vos questions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Nos coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Adresse</p>
                  <p className="text-sm text-muted-foreground">
                    Mairie de Bédarieux
                    <br />
                    1 Avenue Abbé Tarroux
                    <br />
                    34600 Bédarieux
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    contact@abc-bedarieux.fr
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Téléphone</p>
                  <p className="text-sm text-muted-foreground">
                    04 67 95 XX XX
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opening Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horaires d&apos;accueil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Lundi - Vendredi</span>
                <span className="text-muted-foreground">9h00 - 17h00</span>
              </div>
              <div className="flex justify-between">
                <span>Samedi</span>
                <span className="text-muted-foreground">9h00 - 12h00</span>
              </div>
              <div className="flex justify-between">
                <span>Dimanche</span>
                <span className="text-muted-foreground">Fermé</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <a href="mailto:contact@abc-bedarieux.fr">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un email
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <a href="tel:0467950000">
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler directement
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <a
                  href="https://www.google.com/maps/place/Mairie+de+B%C3%A9darieux,+1+Av.+Abb%C3%A9+Tarroux,+34600+B%C3%A9darieux"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Voir sur la carte
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Nos services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm">Animation commerciale</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-sm">Accompagnement des commerçants</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm">Communication digitale</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm">Promotion du territoire</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Comment nous trouver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2897.123456789!2d3.1615!3d43.6147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12b1234567890!2sMairie%20de%20B%C3%A9darieux!5e0!3m2!1sfr!2sfr!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation ABC Bédarieux"
              ></iframe>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Nous sommes situés au cœur de Bédarieux, dans les locaux de la
              mairie. Un parking public est disponible à proximité.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
