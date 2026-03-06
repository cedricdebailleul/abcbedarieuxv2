import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, MapPin, Calendar, Store } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Background ambiance */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl -z-10" />

      {/* Grand 404 en filigrane avec icône centrée */}
      <div className="mb-4 relative flex items-center justify-center">
        <span className="text-[9rem] sm:text-[13rem] font-black leading-none tracking-tighter text-primary/[0.07] select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background rounded-full p-5 shadow-md border border-border">
            <MapPin className="w-11 h-11 text-primary" />
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div className="flex items-center gap-4 mb-8 w-full max-w-xs">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase font-semibold">
          Rue introuvable
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Message */}
      <div className="text-center mb-10 max-w-sm">
        <h1 className="text-2xl font-bold mb-3 text-foreground">
          Cette page n&apos;existe pas
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Elle a peut-être été déplacée ou supprimée. Le reste de Bédarieux
          vous attend&nbsp;!
        </p>
      </div>

      {/* Navigation en grille 2×2 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <Button asChild variant="default" className="h-16 flex-col gap-1.5">
          <Link href="/">
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Accueil</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-16 flex-col gap-1.5">
          <Link href="/places">
            <Store className="w-5 h-5" />
            <span className="text-xs font-medium">Commerces</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-16 flex-col gap-1.5">
          <Link href="/events">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Événements</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-16 flex-col gap-1.5">
          <Link href="/carte">
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-medium">Carte interactive</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
