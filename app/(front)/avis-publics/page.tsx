import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avis publics - ABC Bédarieux",
  description: "Avis publics et annonces officielles de la commune de Bédarieux",
};

export default function AvisPublicsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Avis publics</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            Consultez les avis publics et annonces officielles de la commune de Bédarieux.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Cette section est en cours de développement. 
              Les avis publics seront bientôt disponibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}