"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useGoogleMapsLoader } from "@/hooks/use-google-maps-loader";

interface PlaceFormMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
  className?: string;
}

export function PlaceFormMap({
  latitude,
  longitude, 
  address,
  onCoordinatesChange,
  className = "",
}: PlaceFormMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isLoaded, loadError } = useGoogleMapsLoader();

  // Position par défaut (Bédarieux)
  const defaultCenter = { lat: 43.6108, lng: 3.1612 };
  const center = (latitude && longitude) ? { lat: latitude, lng: longitude } : defaultCenter;

  // Initialiser la carte une seule fois
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      // Créer la carte
      const map = new google.maps.Map(mapRef.current, {
        zoom: (latitude && longitude) ? 16 : 13,
        center: center,
        gestureHandling: "cooperative",
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      // Créer le marker
      const marker = new google.maps.Marker({
        position: center,
        map: map,
        title: "Position de l'établissement",
        draggable: true,
      });

      markerRef.current = marker;

      // Écouter le drag du marker
      marker.addListener("dragend", () => {
        const position = marker.getPosition();
        if (position) {
          const lat = Number(position.lat().toFixed(6));
          const lng = Number(position.lng().toFixed(6));
          onCoordinatesChange(lat, lng);
        }
      });

      // Écouter les clics sur la carte
      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          marker.setPosition(event.latLng);
          const lat = Number(event.latLng.lat().toFixed(6));
          const lng = Number(event.latLng.lng().toFixed(6));
          onCoordinatesChange(lat, lng);
        }
      });

      setIsMapReady(true);

    } catch (err) {
      console.error("Erreur création carte:", err);
      setError("Impossible de créer la carte");
    }
  }, [isLoaded]); // Seulement isLoaded comme dépendance

  // Mettre à jour la position du marker quand les coordonnées changent
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !markerRef.current || !latitude || !longitude) {
      return;
    }

    const newPosition = { lat: latitude, lng: longitude };
    markerRef.current.setPosition(newPosition);
    mapInstanceRef.current.setCenter(newPosition);
  }, [latitude, longitude, isMapReady]);

  if (loadError || error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {error || `Erreur: ${loadError?.message}`}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || !isMapReady) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-gray-300"
      />
      <div className="text-xs text-gray-500 text-center">
        <p>💡 Cliquez sur la carte ou glissez le marqueur rouge pour ajuster la position</p>
        {address && (
          <p className="mt-1">📍 {address}</p>
        )}
      </div>
    </div>
  );
}