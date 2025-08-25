import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditForm } from "./_components/product-edit-form";
import { ServiceEditForm } from "./_components/service-edit-form";
import { OfferEditForm } from "./_components/offer-edit-form";

interface EditPageProps {
  params: {
    type: string;
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { type } = params;

  const titles = {
    product: "Modifier le produit",
    service: "Modifier le service",
    offer: "Modifier l'offre",
  };

  return {
    title: `${titles[type as keyof typeof titles] || "Modifier"} - Dashboard`,
    description: `Modifiez les informations de votre ${type}`,
  };
}

export default function EditPage({ params }: EditPageProps) {
  const { type, id } = params;

  if (!["product", "service", "offer"].includes(type)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {type === "product" && "Modifier le produit"}
          {type === "service" && "Modifier le service"}
          {type === "offer" && "Modifier l'offre"}
        </h1>
        <p className="text-muted-foreground">
          Modifiez les informations et sauvegardez vos changements
        </p>
      </div>

      {type === "product" && <ProductEditForm productId={id} />}
      {type === "service" && <ServiceEditForm serviceId={id} />}
      {type === "offer" && <OfferEditForm offerId={id} />}
    </div>
  );
}
