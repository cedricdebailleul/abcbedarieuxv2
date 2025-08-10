// components/Header/TopBar.jsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export function TopBar() {
  return (
    <div className=" text-gray-700 text-sm ">
      <div className="mx-auto flex items-center border border-gray-200 rounded-4xl shadow-sm justify-between py-3 px-8">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full border-2 border-primary text-primary hover:bg-primary/10"
          >
            <User className="w-4 h-4" />
            Espace citoyen
          </Button>
          {/* Contraste typo */}
          <div className="flex items-center space-x-2">
            <button className="text-sm hover:text-gray-900">A</button>
            <button className="text-base hover:text-gray-900">A</button>
            <button className="text-lg font-bold">A</button>
          </div>
        </div>
        <nav className="flex items-center space-x-8">
          {["Nous joindre", "Actualités", "Événements", "Emplois"].map(
            (item) => (
              <Link
                key={item}
                href="#"
                className="hover:text-primary transition"
              >
                {item}
              </Link>
            )
          )}
        </nav>
      </div>
    </div>
  );
}
