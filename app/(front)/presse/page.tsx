import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presse - ABC Bédarieux",
  description: "Actualités et informations presse de la commune de Bédarieux",
};

export default function PressePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Presse</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Retrouvez ici les dernières actualités et communiqués de presse concernant Bédarieux.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Cette section est en cours de développement. 
              Les actualités presse seront bientôt disponibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}