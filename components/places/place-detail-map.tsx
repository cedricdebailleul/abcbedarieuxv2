"use client";

import { useRef, useEffect, useState } from "react";
import { useGoogleMapsLoader } from "@/hooks/use-google-maps-loader";

interface PlaceDetailMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export function PlaceDetailMap({
  latitude,
  longitude,
  name,
  address,
}: PlaceDetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded } = useGoogleMapsLoader();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapReady) return;

    const position = { lat: latitude, lng: longitude };

    const map = new google.maps.Map(mapRef.current, {
      center: position,
      zoom: 16,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
    });

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title: name,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="padding:4px"><strong>${name}</strong><br/><span style="font-size:12px;color:#666">${address}</span></div>`,
    });

    marker.addListener("click", () => {
      infoWindow.open({ anchor: marker, map });
    });

    setMapReady(true);
  }, [isLoaded, latitude, longitude, name, address, mapReady]);

  if (!isLoaded) {
    return (
      <div className="w-full h-56 bg-muted rounded-xl flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Chargement de la carte...
        </span>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-56 rounded-xl" />;
}
