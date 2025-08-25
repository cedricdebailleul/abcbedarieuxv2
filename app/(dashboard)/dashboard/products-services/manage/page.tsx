import { Metadata } from "next";
import { ProductsServicesManager } from "./_components/products-services-manager";

export const metadata: Metadata = {
  title: "Gérer Produits & Services - Dashboard",
  description: "Gérez vos produits, services et offres existants",
};

export default function ManageProductsServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gérer mes Produits & Services</h1>
        <p className="text-muted-foreground">
          Visualisez, modifiez et gérez tous vos produits, services et offres
        </p>
      </div>

      <ProductsServicesManager />
    </div>
  );
}