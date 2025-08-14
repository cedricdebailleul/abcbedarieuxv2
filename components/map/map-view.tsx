"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MapPlace, MapCategory } from "./interactive-map";
import { DEFAULT_CENTER, getPlacesBounds, getCategoryColor, getPlaceTypeIcon } from "@/lib/map-utils";
import { lucideIconToEmoji } from "@/lib/share-utils";

interface MapViewProps {
  places: MapPlace[];
  selectedPlace: MapPlace | null;
  onPlaceSelect: (place: MapPlace | null) => void;
  userLocation: { lat: number; lng: number } | null;
  categories: MapCategory[];
}

export function MapView({
  places,
  selectedPlace,
  onPlaceSelect,
  userLocation,
  categories
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Créer un mapping des catégories pour les couleurs
  const categoryMap = useRef<Map<string, { color: string; icon?: string }>>(new Map());

  useEffect(() => {
    categories.forEach(category => {
      categoryMap.current.set(category.id, {
        color: getCategoryColor(category),
        icon: category.icon || undefined
      });
      
      category.children.forEach(child => {
        categoryMap.current.set(child.id, {
          color: getCategoryColor(child),
          icon: child.icon || undefined
        });
      });
    });
  }, [categories]);

  // Initialiser Google Maps
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
          version: "weekly",
          libraries: ["marker", "geometry"]
        });

        await loader.load();

        const bounds = getPlacesBounds(places);
        
        const mapConfig: google.maps.MapOptions = {
          center: places.length > 0 ? { 
            lat: (bounds.north + bounds.south) / 2, 
            lng: (bounds.east + bounds.west) / 2 
          } : DEFAULT_CENTER,
          zoom: places.length > 0 ? 12 : 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          }
        };

        // Ajouter le Map ID si disponible
        if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID) {
          mapConfig.mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
        }

        const map = new google.maps.Map(mapRef.current!, mapConfig);

        mapInstanceRef.current = map;
        setIsLoading(false);

        // Ajuster la vue pour inclure toutes les places
        if (places.length > 0) {
          const googleBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(bounds.south, bounds.west),
            new google.maps.LatLng(bounds.north, bounds.east)
          );
          map.fitBounds(googleBounds, { top: 50, right: 50, bottom: 50, left: 50 });
        }

      } catch (error) {
        console.error('Erreur lors du chargement de Google Maps:', error);
        setError('Impossible de charger la carte. Vérifiez votre connexion internet.');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Créer un marker personnalisé
  const createCustomMarker = (place: MapPlace): HTMLElement => {
    const markerDiv = document.createElement('div');
    markerDiv.className = 'custom-marker';
    
    // Obtenir la couleur et l'icône de la première catégorie ou du type de place
    let color = '#6366f1'; // Couleur par défaut
    let icon = '📍'; // Icône par défaut
    
    // Logique pour obtenir l'icône depuis les catégories
    if (place.categories.length > 0) {
      const firstCategory = place.categories[0].category;
      const categoryInfo = categoryMap.current.get(firstCategory.id);
      
      if (categoryInfo) {
        color = categoryInfo.color;
        
        // Convertir l'icône Lucide en emoji si nécessaire
        if (categoryInfo.icon) {
          // Si l'icône commence par une lettre majuscule, c'est probablement un nom Lucide
          if (/^[A-Z]/.test(categoryInfo.icon)) {
            icon = lucideIconToEmoji(categoryInfo.icon);
          } else {
            // Sinon c'est déjà un emoji
            icon = categoryInfo.icon;
          }
        } else {
          icon = getPlaceTypeIcon(place.type);
        }
      } else {
        // Fallback vers l'icône par type
        icon = getPlaceTypeIcon(place.type);
      }
    } else {
      // Si pas de catégorie, utiliser l'icône par type
      icon = getPlaceTypeIcon(place.type);
    }

    markerDiv.innerHTML = `
      <div style="position: relative; transform: translate(-50%, -100%);">
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${color};
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: transform 0.2s;
          ${place.isFeatured ? 'box-shadow: 0 0 0 2px #fbbf24, 0 0 0 4px rgba(251, 191, 36, 0.3);' : ''}
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <span style="color: white; font-size: 18px; font-weight: 600;">${icon}</span>
        </div>
        <div style="
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid ${color};
        "></div>
        ${place.isFeatured ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background-color: #fbbf24;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #92400e;
            font-weight: bold;
          ">★</div>
        ` : ''}
      </div>
    `;

    return markerDiv;
  };

  // Mettre à jour les markers des places
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || categoryMap.current.size === 0) {
      console.log('Markers not ready:', {
        hasMap: !!mapInstanceRef.current,
        hasGoogle: !!window.google,
        categoriesCount: categoryMap.current.size
      });
      return;
    }

    console.log('Creating markers for', places.length, 'places');

    // Supprimer les anciens markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current.clear();

    // Créer les nouveaux markers
    places.forEach(place => {
      if (!place.latitude || !place.longitude) return;

      const markerContent = createCustomMarker(place);
      
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: place.latitude, lng: place.longitude },
        content: markerContent,
        title: place.name
      });

      marker.addListener('click', () => {
        onPlaceSelect(place);
        
        // Animer vers le marker sélectionné
        mapInstanceRef.current?.panTo({ lat: place.latitude!, lng: place.longitude! });
      });

      markersRef.current.set(place.id, marker);
    });

  }, [places, onPlaceSelect, categories]); // Ajouter categories comme dépendance

  // Mettre à jour le marker de l'utilisateur
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Supprimer l'ancien marker utilisateur
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
    }

    // Créer le nouveau marker utilisateur
    if (userLocation) {
      const userMarkerDiv = document.createElement('div');
      userMarkerDiv.innerHTML = `
        <div class="relative transform -translate-x-1/2 -translate-y-1/2">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div class="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full opacity-25 animate-ping"></div>
        </div>
      `;

      const userMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        content: userMarkerDiv,
        title: "Votre position"
      });

      userMarkerRef.current = userMarker;
    }
  }, [userLocation]);

  // Mettre à jour la sélection
  useEffect(() => {
    markersRef.current.forEach((marker, placeId) => {
      const markerElement = marker.content as HTMLElement;
      const markerDiv = markerElement.querySelector('.custom-marker > div > div');
      
      if (selectedPlace?.id === placeId) {
        markerDiv?.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'scale-110');
      } else {
        markerDiv?.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'scale-110');
      }
    });
  }, [selectedPlace]);

  // Recentrer la carte sur l'utilisateur
  const centerOnUser = () => {
    if (!userLocation || !mapInstanceRef.current) {
      toast.error("Position non disponible");
      return;
    }

    mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
    mapInstanceRef.current.setZoom(15);
    toast.success("Carte recentrée sur votre position");
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium text-destructive mb-2">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Bouton de recentrage utilisateur */}
      {userLocation && !isLoading && (
        <Button
          onClick={centerOnUser}
          size="icon"
          className="absolute bottom-4 right-4 shadow-lg"
          title="Recentrer sur ma position"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      )}

      {/* Informations sur les résultats */}
      {!isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border text-sm text-muted-foreground">
          {places.length} établissement{places.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Style pour les markers personnalisés */}
      <style jsx global>{`
        .custom-marker {
          position: relative;
        }
        .custom-marker:hover .relative > div {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}