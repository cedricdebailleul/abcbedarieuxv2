/**
 * Calcule la distance entre deux points géographiques en utilisant la formule de Haversine
 * @param lat1 Latitude du premier point
 * @param lng1 Longitude du premier point  
 * @param lat2 Latitude du deuxième point
 * @param lng2 Longitude du deuxième point
 * @returns Distance en kilomètres
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
}

/**
 * Convertit des degrés en radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formate une distance en texte lisible
 * @param distance Distance en kilomètres
 * @returns Texte formaté (ex: "1.2 km" ou "850 m")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

/**
 * Génère une couleur pour une catégorie basée sur son nom si aucune couleur n'est définie
 */
export function getCategoryColor(category: { color?: string | null; name: string }): string {
  if (category.color) {
    return category.color;
  }

  // Générer une couleur basée sur le hash du nom de la catégorie
  let hash = 0;
  for (let i = 0; i < category.name.length; i++) {
    hash = category.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convertir en couleur HSL avec saturation et luminosité fixes
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

/**
 * Vérifie si une chaîne contient un emoji ou icône valide
 */
export function isValidIcon(icon: string | null | undefined): boolean {
  if (!icon || typeof icon !== 'string' || icon.trim().length === 0) {
    return false;
  }
  
  // Accepter tous les emojis (caractères courts) pour être moins restrictif
  return icon.trim().length <= 10;
}

/**
 * Obtient l'icône par défaut pour un type de place
 */
export function getPlaceTypeIcon(type: string): string {
  const typeIcons: Record<string, string> = {
    COMMERCE: '🏪',
    SERVICE: '🔧',
    RESTAURANT: '🍽️',
    ARTISAN: '🔨',
    ADMINISTRATION: '🏛️',
    MUSEUM: '🏛️',
    TOURISM: '🏛️',
    PARK: '🌳',
    LEISURE: '🎯',
    ASSOCIATION: '🤝',
    HEALTH: '🏥',
    EDUCATION: '🎓',
    TRANSPORT: '🚌',
    ACCOMMODATION: '🏨',
    OTHER: '📍'
  };
  
  return typeIcons[type] || '📍';
}

/**
 * Mapping d'icônes basé sur les noms de catégories courantes
 */
export function getCategoryIconByName(categoryName: string): string {
  const categoryIcons: Record<string, string> = {
    // En français
    'restauration': '🍽️',
    'restaurant': '🍽️', 
    'café': '☕',
    'bar': '🍺',
    'boulangerie': '🍞',
    'commerce': '🏪',
    'magasin': '🏪',
    'épicerie': '🛒',
    'supermarché': '🛒',
    'vêtements': '👕',
    'santé': '🏥',
    'pharmacie': '💊',
    'médecin': '🩺',
    'dentiste': '🦷',
    'coiffure': '✂️',
    'beauté': '💄',
    'sport': '🏃',
    'salle de sport': '🏋️',
    'banque': '🏛️',
    'finance': '💰',
    'hôtel': '🏨',
    'transport': '🚌',
    'garage': '🚗',
    'école': '🎓',
    'éducation': '🎓',
    'bibliothèque': '📚',
    'musée': '🏛️',
    'parc': '🌳',
    'culture': '🎭',
    'art': '🎨',
  };
  
  // Recherche insensible à la casse
  const lowerName = categoryName.toLowerCase();
  
  // Recherche exacte
  if (categoryIcons[lowerName]) {
    return categoryIcons[lowerName];
  }
  
  // Recherche partielle
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return icon;
    }
  }
  
  return '📍'; // Fallback par défaut
}

/**
 * Génère les bounds (limites) pour une liste de places
 */
export function getPlacesBounds(places: Array<{ latitude?: number | null; longitude?: number | null } | PlaceCluster>) {
  const validPlaces = places.filter(p => p.latitude && p.longitude);
  
  if (validPlaces.length === 0) {
    // Bounds par défaut pour Bédarieux
    return {
      north: 43.7,
      south: 43.5,
      east: 3.3,
      west: 3.1
    };
  }

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  validPlaces.forEach(place => {
    if (place.latitude && place.longitude) {
      north = Math.max(north, place.latitude);
      south = Math.min(south, place.latitude);
      east = Math.max(east, place.longitude);
      west = Math.min(west, place.longitude);
    }
  });

  // Ajouter une marge
  const latMargin = (north - south) * 0.1;
  const lngMargin = (east - west) * 0.1;

  return {
    north: north + latMargin,
    south: south - latMargin,
    east: east + lngMargin,
    west: west - lngMargin
  };
}

/**
 * Centre par défaut pour Bédarieux
 */
export const DEFAULT_CENTER = {
  lat: 43.6108,
  lng: 3.1612
};

/**
 * Options de distance pour les filtres
 */
export const DISTANCE_OPTIONS = [
  { value: 0.5, label: "500 m" },
  { value: 1, label: "1 km" },
  { value: 2, label: "2 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" }
];

/**
 * Interface pour représenter un cluster de places
 */
export interface PlaceCluster {
  id: string;
  places: any[];
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  isCluster: boolean;
}

/**
 * Génère une clé d'adresse normalisée pour le clustering
 * @param street Rue
 * @param streetNumber Numéro de rue
 * @param city Ville
 * @param postalCode Code postal
 * @returns Clé d'adresse normalisée
 */
export function generateAddressKey(
  street: string, 
  streetNumber?: string | null, 
  city?: string, 
  postalCode?: string
): string {
  const normalizedStreet = street.trim().toLowerCase();
  const normalizedNumber = streetNumber?.trim() || '';
  const normalizedCity = city?.trim().toLowerCase() || '';
  const normalizedPostal = postalCode?.trim() || '';
  
  return `${normalizedNumber} ${normalizedStreet} ${normalizedCity} ${normalizedPostal}`.trim();
}

/**
 * Groupe les places par adresse identique
 * @param places Liste des places à grouper
 * @returns Liste des places et clusters
 */
export function clusterPlacesByAddress(places: any[]): (any | PlaceCluster)[] {
  const addressMap = new Map<string, any[]>();
  
  // Grouper les places par adresse
  places.forEach(place => {
    // Ne traiter que les places avec coordonnées
    if (!place.latitude || !place.longitude) {
      return;
    }
    
    const addressKey = generateAddressKey(
      place.street,
      place.streetNumber,
      place.city,
      place.postalCode
    );
    
    if (!addressMap.has(addressKey)) {
      addressMap.set(addressKey, []);
    }
    addressMap.get(addressKey)!.push(place);
  });
  
  const result: (any | PlaceCluster)[] = [];
  
  // Traiter chaque groupe d'adresses
  addressMap.forEach((placesAtAddress, addressKey) => {
    if (placesAtAddress.length === 1) {
      // Une seule place à cette adresse, l'ajouter directement
      result.push(placesAtAddress[0]);
    } else {
      // Plusieurs places à la même adresse, créer un cluster
      const firstPlace = placesAtAddress[0];
      const cluster: PlaceCluster = {
        id: `cluster-${addressKey}`,
        places: placesAtAddress,
        address: `${firstPlace.streetNumber ? firstPlace.streetNumber + ' ' : ''}${firstPlace.street}, ${firstPlace.city}`,
        latitude: firstPlace.latitude,
        longitude: firstPlace.longitude,
        isCluster: true
      };
      result.push(cluster);
    }
  });
  
  // Ajouter les places sans coordonnées directement (elles ne seront pas affichées sur la carte)
  places.forEach(place => {
    if (!place.latitude || !place.longitude) {
      result.push(place);
    }
  });
  
  return result;
}