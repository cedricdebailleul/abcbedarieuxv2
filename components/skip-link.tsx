"use client";
import Link from "next/link";

export default function SkipLink() {
  return (
    <Link
      href="#contenu"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-black text-white px-3 py-2 rounded"
    >
      Aller au contenu principal
    </Link>
  );
}
