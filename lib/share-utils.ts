import type { ShareData } from "@/components/shared/social-share";

/**
 * Normalise une chaîne de caractères en supprimant les accents
 * et en convertissant en minuscules pour la recherche
 */
export function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
    .replace(/[^\w\s]/g, ""); // Supprime la ponctuation (garde lettres, chiffres, espaces)
}

/**
 * Génère les données de partage pour un événement
 * Inclut les métadonnées nécessaires pour Facebook Events
 */
export function generateEventShareData(event: {
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  startDate: Date;
  endDate: Date | null;
  isAllDay: boolean;
  locationName?: string | null;
  locationCity?: string | null;
  category?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
  place?: {
    name: string;
    city: string;
  } | null;
}): ShareData {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const eventUrl = `${baseUrl}/events/${event.slug}`;

  // Formatage de la date
  const formatEventDate = () => {
    const start = event.startDate;
    const end = event.endDate;
    const isMultiDay = end ? start.toDateString() !== end.toDateString() : false;

    if (event.isAllDay) {
      if (isMultiDay && end) {
        return `Du ${start.toLocaleDateString("fr-FR")} au ${end.toLocaleDateString("fr-FR")}`;
      } else {
        return start.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    } else {
      if (isMultiDay && end) {
        return `${start.toLocaleDateString("fr-FR")} ${start.toLocaleTimeString(
          "fr-FR",
          { hour: "2-digit", minute: "2-digit" }
        )} - ${end.toLocaleDateString("fr-FR")} ${end.toLocaleTimeString(
          "fr-FR",
          { hour: "2-digit", minute: "2-digit" }
        )}`;
      } else {
        return `${start.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })} à ${start.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })}${end ? ` - ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}`;
      }
    }
  };

  // Lieu de l'événement
  const eventLocation =
    event.locationName ||
    event.place?.name ||
    event.locationCity ||
    "Bédarieux";

  // Description optimisée
  const description =
    event.summary ||
    event.description ||
    `Découvrez cet événement à ${eventLocation}`;

  // Tags depuis l'événement
  const eventTags = event.tags
    ? Array.isArray(event.tags)
      ? event.tags
      : JSON.parse(event.tags)
    : [];
  const categoryTag = event.category ? [event.category] : [];
  const locationTag = event.locationCity ? [event.locationCity] : ["Bédarieux"];

  return {
    title: event.title,
    description:
      description.substring(0, 200) + (description.length > 200 ? "..." : ""),
    url: eventUrl,
    image: event.coverImage || undefined,
    type: "event",
    hashtags: [...eventTags, ...categoryTag, ...locationTag],
    eventDate: formatEventDate(),
    eventLocation,
    // Données structurées pour Facebook Events
    structuredData: {
      startDate: event.startDate.toISOString(),
      ...(event.endDate && { endDate: event.endDate.toISOString() }),
      isAllDay: event.isAllDay,
      timezone: "Europe/Paris",
    },
  };
}

/**
 * Génère les données de partage pour une place
 */
export function generatePlaceShareData(place: {
  name: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  street?: string | null;
  city: string;
  postalCode: string;
  type: string;
  category?: string | null;
  coverImage?: string | null;
  logo?: string | null;
  categories?: Array<{
    category: {
      name: string;
    };
  }>;
}): ShareData {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const placeUrl = `${baseUrl}/places/${place.slug}`;

  // Adresse complète
  const fullAddress = `${place.street || ""}, ${place.postalCode} ${place.city}`.replace(/^,\s*/, "");

  // Description optimisée
  const description =
    place.summary ||
    place.description ||
    `Découvrez ${place.name}, ${getPlaceTypeLabel(place.type)} à ${place.city}`;

  // Catégories de la place
  const categoryTags = place.categories?.map((pc) => pc.category.name) || [];
  const typeTag = [getPlaceTypeLabel(place.type)];
  const locationTag = [place.city];

  return {
    title: place.name,
    description:
      description.substring(0, 200) + (description.length > 200 ? "..." : ""),
    url: placeUrl,
    image: place.coverImage || place.logo || undefined,
    type: "place",
    hashtags: [...categoryTags, ...typeTag, ...locationTag],
    placeAddress: fullAddress,
    placeCategory: categoryTags[0] || getPlaceTypeLabel(place.type),
  };
}

/**
 * Génère les données de partage pour un post
 */
export function generatePostShareData(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  coverImage?: string | null;
  tags?: Array<{
    tag: {
      name: string;
    };
  }>;
  category?: {
    name: string;
  } | null;
  publishedAt?: Date | null;
}): ShareData {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const postUrl = `${baseUrl}/posts/${post.slug}`;

  // Description depuis excerpt ou contenu
  const description =
    post.excerpt ||
    (post.content ? stripHtml(post.content).substring(0, 200) + "..." : "") ||
    `Découvrez cet article sur ${post.title}`;

  // Tags du post - extraire les noms des tags
  const postTags = post.tags ? post.tags.map((pt) => pt.tag.name) : [];
  const categoryTag = post.category ? [post.category.name] : [];

  return {
    title: post.title,
    description:
      description.substring(0, 200) + (description.length > 200 ? "..." : ""),
    url: postUrl,
    image: post.coverImage || undefined,
    type: "post",
    hashtags: [...postTags, ...categoryTag, "Bédarieux", "Article"],
  };
}

/**
 * Convertit le type de place en label français
 */
export function getPlaceTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    COMMERCE: "Commerce",
    SERVICE: "Service",
    RESTAURANT: "Restaurant",
    ARTISAN: "Artisan",
    ADMINISTRATION: "Administration",
    MUSEUM: "Musée",
    TOURISM: "Tourisme",
    PARK: "Parc",
    LEISURE: "Loisir",
    ASSOCIATION: "Association",
    HEALTH: "Santé",
    EDUCATION: "Éducation",
    TRANSPORT: "Transport",
    ACCOMMODATION: "Hébergement",
    OTHER: "Autre",
  };

  return typeLabels[type] || type;
}

/**
 * Convertit une icône Lucide en emoji
 */
export function lucideIconToEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    // Restaurants & Food
    UtensilsCrossed: "🍽️",
    "utensils-crossed": "🍽️",
    ChefHat: "👨‍🍳",
    "chef-hat": "👨‍🍳",
    Coffee: "☕",
    coffee: "☕",
    Pizza: "🍕",
    pizza: "🍕",
    Utensils: "🍴",
    utensils: "🍴",
    Beer: "🍺",
    beer: "🍺",
    Wine: "🍷",
    wine: "🍷",
    Croissant: "🥐",
    croissant: "🥐",
    Sandwich: "🥪",
    sandwich: "🥪",
    Soup: "🍲",
    soup: "🍲",
    Beef: "🥩",
    beef: "🥩",
    Carrot: "🥕",
    carrot: "🥕",

    // Commerce
    Store: "🏪",
    store: "🏪",
    ShoppingBasket: "🛒",
    "shopping-basket": "🛒",
    ShoppingCart: "🛒",
    "shopping-cart": "🛒",
    Shirt: "👕",
    shirt: "👕",
    ShoppingBag: "🛍️",
    "shopping-bag": "🛍️",
    Gem: "💎",
    gem: "💎",
    Baby: "👶",
    baby: "👶",
    Footprints: "👟",
    footprints: "👟",

    // Services
    Briefcase: "💼",
    briefcase: "💼",
    Wrench: "🔧",
    wrench: "🔧",
    Car: "🚗",
    car: "🚗",
    Hammer: "🔨",
    hammer: "🔨",
    Settings: "⚙️",
    settings: "⚙️",
    Tool: "🔧",
    tool: "🔧",
    Scissors: "✂️",
    scissors: "✂️",
    Key: "🔑",
    key: "🔑",
    Ruler: "📏",
    ruler: "📏",

    // Santé
    Heart: "❤️",
    heart: "❤️",
    HeartPulse: "💓",
    "heart-pulse": "💓",
    Stethoscope: "🩺",
    stethoscope: "🩺",
    Pill: "💊",
    pill: "💊",
    Cross: "➕",
    cross: "➕",
    FirstAid: "🏥",
    "first-aid": "🏥",
    Glasses: "👓",
    glasses: "👓",
    Ear: "👂",
    ear: "👂",

    // Éducation & Culture
    Book: "📚",
    book: "📚",
    BookOpen: "📖",
    "book-open": "📖",
    GraduationCap: "🎓",
    "graduation-cap": "🎓",
    School: "🏫",
    school: "🏫",
    Library: "📖",
    library: "📖",
    Museum: "🏛️",
    museum: "🏛️",
    Palette: "🎨",
    palette: "🎨",
    Music: "🎵",
    music: "🎵",
    FileText: "📄",
    "file-text": "📄",

    // Finance
    DollarSign: "💰",
    "dollar-sign": "💰",
    CreditCard: "💳",
    "credit-card": "💳",
    Banknote: "💵",
    banknote: "💵",
    PiggyBank: "🐷",
    "piggy-bank": "🐷",
    Coins: "🪙",
    coins: "🪙",
    Landmark: "🏦",
    landmark: "🏦",

    // Transport
    Bus: "🚌",
    bus: "🚌",
    Train: "🚂",
    train: "🚂",
    Plane: "✈️",
    plane: "✈️",
    Bike: "🚲",
    bike: "🚲",
    Fuel: "⛽",
    fuel: "⛽",

    // Sport & Loisirs
    Dumbbell: "🏋️",
    dumbbell: "🏋️",
    Trophy: "🏆",
    trophy: "🏆",
    Target: "🎯",
    target: "🎯",
    Gamepad: "🎮",
    gamepad: "🎮",
    Gamepad2: "🎮",
    "gamepad-2": "🎮",
    Football: "⚽",
    football: "⚽",
    Puzzle: "🧩",
    puzzle: "🧩",

    // Maison & Déco
    Home: "🏠",
    home: "🏠",
    Sofa: "🛋️",
    sofa: "🛋️",
    Armchair: "🪑",
    armchair: "🪑",
    Lamp: "💡",
    lamp: "💡",
    Tv: "📺",
    tv: "📺",

    // Nature & Beauté
    Flower: "🌸",
    flower: "🌸",
    Flower2: "🌺",
    "flower-2": "🌺",
    Trees: "🌳",
    trees: "🌳",
    Sparkles: "✨",
    sparkles: "✨",
    SprayCan: "🧴",
    "spray-can": "🧴",
    Droplet: "💧",
    droplet: "💧",

    // Tech
    Smartphone: "📱",
    smartphone: "📱",
    Zap: "⚡",
    zap: "⚡",

    // Autres
    Building: "🏢",
    building: "🏢",
    MapPin: "📍",
    "map-pin": "📍",
    Phone: "📞",
    phone: "📞",
    Mail: "📧",
    mail: "📧",
    Globe: "🌐",
    globe: "🌐",
    Calendar: "📅",
    calendar: "📅",
    Clock: "🕐",
    clock: "🕐",
    Star: "⭐",
    star: "⭐",
    Bookmark: "🔖",
    bookmark: "🔖",
  };

  return iconMap[iconName] || "📍";
}

/**
 * Les catégories sont déjà en français, cette fonction n'est plus nécessaire mais gardée pour compatibilité
 */
export function getCategoryFrenchLabel(categoryName: string): string {
  // Les catégories sont déjà en français dans la base de données
  return categoryName;
}

/**
 * Supprime les balises HTML d'un texte
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Génère les métadonnées Open Graph pour une page de partage
 */
export function generateOpenGraphMeta(shareData: ShareData) {
  return {
    title: shareData.title,
    description: shareData.description,
    url: shareData.url,
    siteName: "ABC Bédarieux",
    images: shareData.image
      ? [
          {
            url: shareData.image,
            width: 1200,
            height: 630,
            alt: shareData.title,
          },
        ]
      : [],
    locale: "fr_FR",
    type: shareData.type === "post" ? "article" : "website",
  };
}

/**
 * Génère les métadonnées Twitter Card
 */
export function generateTwitterMeta(shareData: ShareData) {
  return {
    card: "summary_large_image",
    title: shareData.title,
    description: shareData.description,
    images: shareData.image ? [shareData.image] : [],
    creator: "@abc_bedarieux", // À adapter selon votre compte Twitter
  };
}
