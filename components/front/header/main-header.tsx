// components/Header/MainHeader.jsx

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { label: "Ville", items: ["Conseil", "Histoire", "Stats", "Règlements"] },
  { label: "Services", items: ["Permis", "Collecte", "Urbanisme", "Taxes"] },
  {
    label: "Loisirs",
    items: ["Bibliothèque", "Évènements", "Sports", "Parcs"],
  },
];

export function MainHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex items-center justify-between py-3 px-8 ">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Logo width={100} height={50} />
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-12">
          {NAV.map(({ label, items }) => (
            <div key={label} className="relative group">
              <button type="button" className="flex items-center gap-1 text-gray-700 font-medium hover:text-gray-900">
                {label} <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                {items.map((i) => (
                  <Link
                    key={i}
                    href="#"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    {i}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* CTA + Search */}
        <div className="flex items-center gap-4">
          <Button className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-gray-800">
            Populaires
          </Button>
          <Button
            size="icon"
            className="bg-primary text-white w-10 h-10 rounded-full hover:bg-primary/90"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
