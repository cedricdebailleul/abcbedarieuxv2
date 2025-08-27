// Utiliser les vrais types Google Maps - éviter les conflits
export type GoogleMapsLoadedApi = typeof google;

// Éviter les conflits de types globaux - utiliser les types natifs

// Types personnalisés pour nos besoins spécifiques
export interface MapPosition {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: MapPosition;
  };
  types: string[];
}

// Types pour les événements de map
export interface MapClickEvent {
  latLng: google.maps.LatLng;
}

export interface MapDragEndEvent {
  latLng: google.maps.LatLng;
}