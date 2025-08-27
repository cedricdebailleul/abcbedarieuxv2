"use client";

import { useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";

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
  const initialized = useRef(false);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  
  useEffect(() => {
    // Si déjà initialisé, ne rien faire
    if (initialized.current) return;
    
    // Attendre que Google Maps soit disponible
    const checkGoogle = () => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps) {
        setTimeout(checkGoogle, 100);
        return;
      }
      
      // Google Maps est disponible, créer la carte
      if (mapRef.current) {
        try {
          const center = { 
            lat: latitude || 43.6108, 
            lng: longitude || 3.1612 
          };
          
          const map = new window.google.maps.Map(mapRef.current, {
            zoom: 15,
            center: center,
          });
          
          const marker = new window.google.maps.Marker({
            position: center,
            map: map,
            draggable: true,
          });

          // Sauvegarder les instances pour les mises à jour
          mapInstance.current = map;
          markerInstance.current = marker;
          
          // Events
          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            if (pos) {
              onCoordinatesChange(pos.lat(), pos.lng());
            }
          });
          
          map.addListener("click", (e: any) => {
            if (e.latLng) {
              marker.setPosition(e.latLng);
              onCoordinatesChange(e.latLng.lat(), e.latLng.lng());
            }
          });
          
          initialized.current = true;
        } catch (error) {
          console.error("Erreur création carte:", error);
        }
      }
    };
    
    checkGoogle();
  }, []); // Aucune dépendance !

  // Synchroniser la position quand latitude/longitude changent depuis l'extérieur
  useEffect(() => {
    if (initialized.current && mapInstance.current && markerInstance.current && latitude && longitude) {
      const newPosition = { lat: latitude, lng: longitude };
      markerInstance.current.setPosition(newPosition);
      mapInstance.current.setCenter(newPosition);
    }
  }, [latitude, longitude]);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div ref={mapRef} className="w-full h-64 rounded-lg border bg-gray-100" />
      <p className="text-xs text-gray-500 text-center">
        🗺️ Carte interactive - Drag & drop pour repositionner
      </p>
      {address && (
        <p className="text-xs text-gray-400 text-center">📍 {address}</p>
      )}
    </div>
  );
}