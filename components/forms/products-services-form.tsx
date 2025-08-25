"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Wrench, Tag, MapPin } from "lucide-react";
import { PlaceSelector } from "./place-selector";
import { ProductForm } from "./product-form";
import { ServiceForm } from "./service-form";
import { OfferForm } from "./offer-form";

type FormType = 'product' | 'service' | 'offer';

interface Place {
  id: string;
  name: string;
  city: string;
  type: string;
  status: string;
}

interface ProductsServicesFormProps {
  defaultTab?: FormType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductsServicesForm({
  defaultTab = 'product',
  onSuccess,
  onCancel,
}: ProductsServicesFormProps) {
  const [activeTab, setActiveTab] = useState<FormType>(defaultTab);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const handlePlaceChange = (placeId: string, place?: Place) => {
    setSelectedPlaceId(placeId);
    setSelectedPlace(place || null);
  };

  const handleFormSuccess = () => {
    onSuccess?.();
  };

  const tabs = [
    {
      value: 'product' as FormType,
      label: 'Produit',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      value: 'service' as FormType,
      label: 'Service',
      icon: Wrench,
      color: 'text-green-600',
    },
    {
      value: 'offer' as FormType,
      label: 'Offre',
      icon: Tag,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sélection du lieu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Sélection du lieu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PlaceSelector
              value={selectedPlaceId}
              onValueChange={handlePlaceChange}
              placeholder="Choisissez le lieu pour ce contenu..."
            />
            
            {selectedPlace && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedPlace.name}</span>
                <Badge variant="outline">{selectedPlace.city}</Badge>
                <Badge variant="outline">{selectedPlace.type}</Badge>
              </div>
            )}
            
            {!selectedPlaceId && (
              <p className="text-sm text-muted-foreground">
                Vous devez sélectionner un lieu avant de pouvoir ajouter des produits, services ou offres.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulaires */}
      {selectedPlaceId && selectedPlace && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FormType)}>
          <TabsList className="grid w-full grid-cols-3">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex items-center gap-2"
              >
                <tab.icon className={`h-4 w-4 ${tab.color}`} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="product" className="mt-6">
            <ProductForm
              placeId={selectedPlaceId}
              placeName={selectedPlace.name}
              onSuccess={handleFormSuccess}
              onCancel={onCancel}
            />
          </TabsContent>

          <TabsContent value="service" className="mt-6">
            <ServiceForm
              placeId={selectedPlaceId}
              placeName={selectedPlace.name}
              onSuccess={handleFormSuccess}
              onCancel={onCancel}
            />
          </TabsContent>

          <TabsContent value="offer" className="mt-6">
            <OfferForm
              placeId={selectedPlaceId}
              placeName={selectedPlace.name}
              onSuccess={handleFormSuccess}
              onCancel={onCancel}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}