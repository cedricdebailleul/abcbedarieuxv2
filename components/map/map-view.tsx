"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Navigation, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import type { MapPlace, MapCategory } from "./interactive-map";
import type { PlaceCluster } from "@/lib/map-utils";
import {
  DEFAULT_CENTER,
  getPlacesBounds,
  getCategoryColor,
  getPlaceTypeIcon,
} from "@/lib/map-utils";
import { lucideIconToEmoji } from "@/lib/share-utils";
import { useGoogleMapsLoader } from "@/hooks/use-google-maps-loader";
import { env } from "@/lib/env";

interface MapViewProps {
  places: (MapPlace | PlaceCluster)[];
  selectedPlace: MapPlace | null;
  onPlaceSelect: (place: MapPlace | null) => void;
  onClusterSelect?: (cluster: PlaceCluster) => void;
  userLocation: { lat: number; lng: number } | null;
  categories: MapCategory[];
  hasActiveFilters?: boolean;
}

export function MapView({
  places,
  selectedPlace,
  onPlaceSelect,
  onClusterSelect,
  userLocation,
  categories,
  hasActiveFilters = false,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement>
  >(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Créer un mapping des catégories pour les couleurs
  const categoryMap = useRef<Map<string, { color: string; icon?: string }>>(
    new Map()
  );

  const [categoriesReady, setCategoriesReady] = useState(false);
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    categories.forEach((category) => {
      categoryMap.current.set(category.id, {
        color: getCategoryColor(category),
        icon: category.icon || undefined,
      });

      category.children.forEach((child) => {
        categoryMap.current.set(child.id, {
          color: getCategoryColor(child),
          icon: child.icon || undefined,
        });
      });
    });

    // Marquer les catégories comme prêtes
    setCategoriesReady(true);

    // Forcer un re-rendu après que les catégories soient prêtes
    setTimeout(() => setForceRender((prev) => prev + 1), 200);
  }, [categories]);

  // Vérification de sécurité - si pas de markers après 2 secondes, forcer re-création
  useEffect(() => {
    if (places.length > 0 && categoriesReady) {
      const checkTimer = setTimeout(() => {
        if (markersRef.current.size === 0) {
          setForceRender((prev) => prev + 1);
        }
      }, 2000);

      return () => clearTimeout(checkTimer);
    }
  }, [places.length, categoriesReady]);

  // Utiliser le loader centralisé
  const { isLoaded, loadError, google } = useGoogleMapsLoader();

  // Gérer les erreurs de chargement de l'API
  useEffect(() => {
    if (loadError) {
      setError("Erreur lors du chargement de Google Maps");
      setIsLoading(false);
    }
  }, [loadError]);

  // Initialiser Google Maps
  useEffect(() => {
    if (!mapRef.current || !isLoaded || !google) return;

    const initMap = async () => {
      try {
        const bounds = getPlacesBounds(places);

        const mapConfig: google.maps.MapOptions = {
          center:
            places.length > 0
              ? {
                  lat: (bounds.north + bounds.south) / 2,
                  lng: (bounds.east + bounds.west) / 2,
                }
              : DEFAULT_CENTER,
          zoom: places.length > 0 ? 12 : 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          scrollwheel: true,
          gestureHandling: "greedy",
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
        };

        // Ajouter le Map ID si disponible
        if (env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID) {
          mapConfig.mapId = env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
        } else {
          // Ajouter les styles seulement si pas de mapId
          mapConfig.styles = [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ];
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
          map.fitBounds(googleBounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement de Google Maps:", error);
        setError(
          "Impossible de charger la carte. Vérifiez votre connexion internet."
        );
        setIsLoading(false);
      }
    };

    initMap();
  }, [isLoaded, google, places]);

  // Ajuster les bounds quand les places changent (sans recréer la carte)
  useEffect(() => {
    if (!mapInstanceRef.current || places.length === 0 || !google) return;

    const timer = setTimeout(() => {
      const placesWithCoords = places.filter((p) => p.latitude && p.longitude);
      if (placesWithCoords.length > 0) {
        const googleBounds = new google.maps.LatLngBounds();
        placesWithCoords.forEach((place) => {
          googleBounds.extend(
            new google.maps.LatLng(place.latitude!, place.longitude!)
          );
        });

        // N'inclure la position utilisateur que si aucun filtre actif
        if (userLocation && !hasActiveFilters) {
          googleBounds.extend(
            new google.maps.LatLng(userLocation.lat, userLocation.lng)
          );
        }

        mapInstanceRef.current?.fitBounds(googleBounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        });
      }
    }, 100); // Petit délai pour éviter les conflits

    return () => clearTimeout(timer);
  }, [places, userLocation, google, hasActiveFilters]);

  // Créer un marker personnalisé
  const createCustomMarker = useCallback((place: MapPlace): HTMLElement => {
    const markerDiv = document.createElement("div");
    markerDiv.className = "custom-marker";

    // Obtenir la couleur et l'icône de la première catégorie ou du type de place
    let color = "#6366f1"; // Couleur par défaut
    let icon = "📍"; // Icône par défaut

    // Style spécial pour les places à revendiquer (sans propriétaire)
    const isClaimable = !place.ownerId;

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

    // Adapter le style pour les places à revendiquer
    if (isClaimable) {
      color = "#f59e0b"; // Orange pour les places à revendiquer
      icon = "🏪"; // Icône spéciale
    }

    // Créer un style plus simple et compatible avec Google Maps
    markerDiv.style.cssText = `
      position: absolute;
      transform: translate(-50%, -100%);
      z-index: ${place.isFeatured ? 1000 : isClaimable ? 750 : 500};
    `;

    markerDiv.innerHTML = `
      <div style="position: relative;">
        ${
          isClaimable
            ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            width: 16px;
            height: 16px;
            background-color: #dc2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: white;
            font-weight: bold;
            border: 2px solid white;
            z-index: 1;
          ">!</div>
        `
            : ""
        }
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          border: ${isClaimable ? "3px solid #dc2626" : "2px solid white"};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          ${
            place.isFeatured
              ? "border: 3px solid #fbbf24;"
              : "border: 2px solid white;"
          }
        ">
          <span style="color: white; font-size: 16px; line-height: 1;">${icon}</span>
        </div>
        <div style="
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -6px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
        "></div>
      </div>
    `;

    return markerDiv;
  }, []);

  // Rendu personnalisé pour les clusters
  const clusterRenderer = useMemo(() => ({
    render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
      const clusterDiv = document.createElement("div");
      clusterDiv.className = "cluster-marker";

      // Taille du cluster basée sur le nombre
      const size = count < 10 ? 40 : count < 50 ? 48 : 56;
      const fontSize = count < 10 ? 14 : count < 50 ? 16 : 18;
      const color = count < 10 ? "#10b981" : count < 50 ? "#3b82f6" : "#8b5cf6";

      clusterDiv.style.cssText = `
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 800;
      `;

      clusterDiv.innerHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <span style="color: white; font-size: ${fontSize}px; font-weight: bold; line-height: 1;">${count}</span>
        </div>
      `;

      return new window.google.maps.marker.AdvancedMarkerElement({
        position,
        content: clusterDiv,
        zIndex: 800,
      });
    },
  }), []);

  // Mettre à jour les markers des places avec clustering dynamique
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !categoriesReady) {
      return;
    }

    // Vérifier que AdvancedMarkerElement est disponible
    if (!window.google.maps.marker?.AdvancedMarkerElement) {
      console.error("AdvancedMarkerElement not available");
      return;
    }

    const timer = setTimeout(() => {
      // Supprimer l'ancien clusterer et ses markers
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }

      // Supprimer les anciens markers
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current.clear();

      // Filtrer les places individuelles (pas les clusters pré-calculés)
      const individualPlaces = places.filter(
        (item) => !('isCluster' in item && item.isCluster) && item.latitude && item.longitude
      ) as MapPlace[];

      // Créer les markers individuels
      const markersForClusterer: google.maps.marker.AdvancedMarkerElement[] = [];

      individualPlaces.forEach((place) => {
        const markerContent = createCustomMarker(place);

        try {
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat: place.latitude ?? 0, lng: place.longitude ?? 0 },
            content: markerContent,
            title: place.name,
            zIndex: place.isFeatured ? 1000 : 500,
          });

          marker.addListener("click", () => {
            onPlaceSelect(place);
            mapInstanceRef.current?.panTo({
              lat: place.latitude ?? 0,
              lng: place.longitude ?? 0,
            });
          });

          markersRef.current.set(place.id, marker);
          markersForClusterer.push(marker);
        } catch (error) {
          console.error("Error creating marker:", error);
        }
      });

      // Créer le clusterer avec algorithme SuperCluster
      if (mapInstanceRef.current && markersForClusterer.length > 0) {
        clustererRef.current = new MarkerClusterer({
          map: mapInstanceRef.current,
          markers: markersForClusterer,
          algorithm: new SuperClusterAlgorithm({
            maxZoom: 17,  // Au-delà de zoom 17, plus de clustering
            radius: 80,   // Rayon en pixels pour grouper les markers
          }),
          renderer: clusterRenderer,
          onClusterClick: (event, cluster, map) => {
            // Zoomer sur le cluster quand on clique dessus
            if (cluster.bounds) {
              map.fitBounds(cluster.bounds, {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50,
              });
            }
          },
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [places, onPlaceSelect, onClusterSelect, categoriesReady, forceRender, createCustomMarker, clusterRenderer]);

  // Mettre à jour le marker de l'utilisateur
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Vérifier que AdvancedMarkerElement est disponible
    if (!window.google.maps.marker?.AdvancedMarkerElement) {
      return;
    }

    // Supprimer l'ancien marker utilisateur
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
    }

    // Créer le nouveau marker utilisateur
    if (userLocation) {
      const userMarkerDiv = document.createElement("div");
      userMarkerDiv.innerHTML = `
        <div class="relative transform -translate-x-1/2 -translate-y-1/2">
          <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div class="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full opacity-25 animate-ping"></div>
        </div>
      `;

      try {
        const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: { lat: userLocation.lat, lng: userLocation.lng },
          content: userMarkerDiv,
          title: "Votre position",
        });

        userMarkerRef.current = userMarker;
      } catch (error) {
        console.error("Error creating user marker:", error);
      }
    }
  }, [userLocation]);

  // Mettre à jour la sélection
  useEffect(() => {
    markersRef.current.forEach((marker, placeId) => {
      const markerElement = marker.content as HTMLElement;
      const markerDiv = markerElement.querySelector(
        ".custom-marker > div > div"
      );

      if (selectedPlace?.id === placeId) {
        markerDiv?.classList.add(
          "ring-4",
          "ring-primary",
          "ring-offset-2",
          "scale-110"
        );
      } else {
        markerDiv?.classList.remove(
          "ring-4",
          "ring-primary",
          "ring-offset-2",
          "scale-110"
        );
      }
    });
  }, [selectedPlace]);

  // Recentrer la carte sur l'utilisateur
  const centerOnUser = () => {
    if (!userLocation || !mapInstanceRef.current) {
      toast.error("Position non disponible");
      return;
    }

    mapInstanceRef.current.setCenter({
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
    mapInstanceRef.current.setZoom(15);
    toast.success("Carte recentrée sur votre position");
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium text-destructive mb-2">
              Erreur de chargement
            </p>
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
            <p className="text-sm text-muted-foreground">
              Chargement de la carte...
            </p>
          </div>
        </div>
      )}

      {/* Bouton de recentrage utilisateur */}
      {userLocation && !isLoading && (
        <Button
          onClick={centerOnUser}
          size="icon"
          className="absolute top-24 left-4 shadow-lg z-40"
          title="Recentrer sur ma position"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      )}

      {/* Informations sur les résultats */}
      {!isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border text-sm text-muted-foreground">
          {places.length} établissement{places.length > 1 ? "s" : ""}
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
        .cluster-marker:hover > div {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
