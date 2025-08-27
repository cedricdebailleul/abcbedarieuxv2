"use client";

import { MapPin } from "lucide-react";

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
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="w-full h-64 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-700 mb-2">Carte temporairement indisponible</h3>
          <p className="text-sm text-gray-500 mb-4">
            Utilisez les boutons GPS pour obtenir/actualiser les coordonnées
          </p>
          {(latitude && longitude) && (
            <div className="text-xs text-gray-600 space-y-1">
              <p>📍 Position actuelle :</p>
              <p>Lat: {latitude.toFixed(6)}</p>
              <p>Lng: {longitude.toFixed(6)}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        <p>🔧 Carte interactive en cours de développement</p>
        {address && (
          <p className="mt-1">📍 {address}</p>
        )}
      </div>
    </div>
  );
}