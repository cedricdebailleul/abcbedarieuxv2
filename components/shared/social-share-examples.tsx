import { SocialShare, type ShareData } from "./social-share";
import {
  generateEventShareData,
  generatePlaceShareData,
  generatePostShareData,
} from "@/lib/share-utils";

// Exemples d'utilisation du composant SocialShare

/**
 * Exemple 1: Partage pour un événement
 */
export function EventShareExample() {
  const event = {
    title: "Concert d'été à Bédarieux",
    slug: "concert-ete-bedarieux",
    summary: "Une soirée musicale exceptionnelle en plein air",
    description:
      "Venez profiter d'un concert exceptionnel avec des artistes locaux...",
    startDate: new Date("2024-07-15T20:00:00"),
    endDate: new Date("2024-07-15T23:00:00"),
    isAllDay: false,
    locationName: "Parc Municipal",
    locationCity: "Bédarieux",
    category: "MUSIC",
    tags: ["musique", "concert", "été"],
    coverImage: "/uploads/events/concert-ete.jpg",
  };

  return (
    <SocialShare
      data={generateEventShareData(event)}
      variant="default"
      size="default"
      showLabel={true}
    />
  );
}

/**
 * Exemple 2: Partage pour une place
 */
export function PlaceShareExample() {
  const place = {
    name: "Restaurant Le Petit Bistrot",
    slug: "restaurant-petit-bistrot",
    summary: "Cuisine traditionnelle française dans une ambiance chaleureuse",
    description: "Découvrez notre restaurant familial au cœur de Bédarieux...",
    street: "12 Rue de la République",
    city: "Bédarieux",
    postalCode: "34600",
    type: "RESTAURANT",
    coverImage: "/uploads/places/bistrot-cover.jpg",
    categories: [{ category: { name: "Restaurant français" } }],
  };

  return (
    <SocialShare
      data={generatePlaceShareData(place)}
      variant="outline"
      size="sm"
      showLabel={true}
    />
  );
}

/**
 * Exemple 3: Partage pour un post/article
 */
export function PostShareExample() {
  const post = {
    title: "Les nouveautés de l'été à Bédarieux",
    slug: "nouveautes-ete-bedarieux",
    excerpt:
      "Découvrez toutes les activités et événements prévus cet été dans notre belle ville",
    content: "<p>L'été s'annonce riche en activités à Bédarieux...</p>",
    coverImage: "/uploads/posts/ete-bedarieux.jpg",
    tags: ["actualités", "été", "activités"].map((tag) => ({
      tag: { name: tag },
    })),
    category: { name: "Actualités locales" },
    publishedAt: new Date("2024-06-01T10:00:00"),
  };

  return (
    <SocialShare
      data={generatePostShareData(post)}
      variant="ghost"
      size="sm"
      showLabel={false}
    />
  );
}

/**
 * Exemple 4: Utilisation avec des données personnalisées
 */
export function CustomShareExample() {
  const customShareData: ShareData = {
    title: "Découvrez Bédarieux",
    description: "Une ville pleine de charme au cœur de l'Hérault",
    url: "https://abcbedarieux.com/decouvrir",
    image: "/images/bedarieux-panorama.jpg",
    type: "post",
    hashtags: ["Bédarieux", "Hérault", "Découverte", "Tourisme"],
  };

  return (
    <SocialShare
      data={customShareData}
      variant="default"
      size="lg"
      showLabel={true}
      className="shadow-lg"
    />
  );
}

/**
 * Exemple 5: Bouton compact pour mobile
 */
export function MobileShareButton({ data }: { data: ShareData }) {
  return (
    <SocialShare
      data={data}
      variant="ghost"
      size="icon"
      showLabel={false}
      className="md:hidden"
    />
  );
}

/**
 * Exemple 6: Intégration dans une barre d'actions
 */
export function ActionBarShare({ data }: { data: ShareData }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <span className="text-sm text-muted-foreground">Partager :</span>
      <SocialShare data={data} variant="outline" size="sm" showLabel={false} />
      {/* Autres actions comme favoris, signaler, etc. */}
    </div>
  );
}
