import { Metadata } from "next";
import { ProductsServicesForm } from "@/components/forms/products-services-form";

export const metadata: Metadata = {
  title: "Produits & Services - Dashboard",
  description: "Gérez les produits, services et offres de vos lieux",
};

export default function ProductsServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produits & Services</h1>
        <p className="text-muted-foreground">
          Ajoutez et gérez les produits, services et offres de vos lieux
        </p>
      </div>

      <ProductsServicesForm />
    </div>
  );
}