"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, MapPin } from "lucide-react";

interface PlaceFormMapInteractiveProps {
  initialLat: number;
  initialLng: number;
  onPositionChange: (lat: number, lng: number) => void;
}

export function PlaceFormMapInteractive({
  initialLat,
  initialLng,
  onPositionChange,
}: PlaceFormMapInteractiveProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markerInstance, setMarkerInstance] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  const mapId = `interactive-map-${Date.now()}`;

  const initializeMap = useCallback(async () => {
    try {
      const mapElement = document.getElementById(mapId);
      if (!mapElement) {
        setError("Conteneur de carte non trouvé");
        return;
      }

      if (!window.google?.maps) {
        setError("Google Maps API non disponible");
        return;
      }

      // Créer la carte
      const map = new window.google.maps.Map(mapElement, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // Load the marker library
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // Créer le marqueur draggable
      const marker = new AdvancedMarkerElement({
        position: { lat: initialLat, lng: initialLng },
        map: map,
        gmpDraggable: true,
        title: "Glissez pour repositionner",
      });

      // Écouter les changements de position
      marker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          onPositionChange(lat, lng);
        }
      });

      // Permettre de cliquer sur la carte pour repositionner
      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          marker.position = { lat, lng };
          onPositionChange(lat, lng);
        }
      });

      setMapInstance(map);
      setMarkerInstance(marker);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error("Erreur initialisation carte:", err);
      setError("Erreur lors de l'initialisation de la carte");
      setIsLoading(false);
    }
  }, [initialLat, initialLng, mapId, onPositionChange]);

  // Charger l'API Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError("Clé API Google Maps manquante");
      setIsLoading(false);
      return;
    }

    if (window.google?.maps) {
      initializeMap();
      return;
    }

    // Vérifier si le script est déjà en cours de chargement
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      setError("Chargement de l'API Google Maps...");
      
      const checkGoogleMaps = () => {
        if (window.google?.maps) {
          initializeMap();
        } else {
          setTimeout(checkGoogleMaps, 200);
        }
      };
      checkGoogleMaps();
      return;
    }

    // Créer et charger le script Google Maps
    setError("Téléchargement de l'API Google Maps...");
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Attendre que l'API soit complètement initialisée
      const waitForGoogleMaps = () => {
        if (window.google?.maps?.Map && window.google?.maps?.Marker) {
          initializeMap();
        } else {
          setTimeout(waitForGoogleMaps, 100);
        }
      };
      waitForGoogleMaps();
    };
    
    script.onerror = () => {
      setError("Échec du chargement de Google Maps. Vérifiez votre connexion.");
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, [initializeMap]);

  // Mettre à jour la position du marqueur quand les coordonnées changent
  useEffect(() => {
    if (mapInstance && markerInstance) {
      const newPosition = { lat: initialLat, lng: initialLng };
      markerInstance.position = newPosition;
      mapInstance.setCenter(newPosition);
    }
  }, [initialLat, initialLng, mapInstance, markerInstance]);

  if (isLoading) {
    return (
      <div className="w-full h-64 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 flex items-center justify-center">
        <div className="text-center text-blue-600">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p className="text-sm font-medium">Chargement de la carte interactive...</p>
          {error && error.includes("Téléchargement") && (
            <p className="text-xs mt-1">Première utilisation - téléchargement en cours</p>
          )}
          {error && error.includes("Chargement") && (
            <p className="text-xs mt-1">Initialisation de l&apos;API...</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 rounded-lg border-2 border-red-300 bg-red-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Carte temporairement indisponible</p>
          <p className="text-xs">{error}</p>
          <p className="text-xs mt-2">Lat: {initialLat} / Lng: {initialLng}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Carte interactive</p>
            <p className="text-blue-700 text-xs">
              • Cliquez sur la carte pour repositionner<br/>
              • Glissez le marqueur pour ajuster finement
            </p>
          </div>
        </div>
      </div>
      
      <div
        id={mapId}
        className="w-full h-64 rounded-lg border shadow-sm"
        style={{ minHeight: '256px' }}
      />
      
      <div className="text-xs text-gray-500 text-center">
        📍 Position: {initialLat.toFixed(6)}, {initialLng.toFixed(6)}
      </div>
    </div>
  );
}