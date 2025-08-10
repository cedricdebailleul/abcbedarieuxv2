"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => ({
    label: decodeURIComponent(part.replace(/-/g, " ")),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));

  return (
    <nav aria-label="Fil d'Ariane" className="text-sm mb-3">
      <ol className="flex flex-wrap gap-1 text-muted-foreground">
        <li>
          <Link href="/">Accueil</Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            <span aria-hidden>›</span>
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="font-medium text-foreground">
                {c.label}
              </span>
            ) : (
              <Link href={c.href}>{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
