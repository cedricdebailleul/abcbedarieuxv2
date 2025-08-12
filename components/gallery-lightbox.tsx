"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";

interface GalleryLightboxProps {
  images: string[];
  placeName: string;
}

function isExternal(url: string) {
  return url.startsWith("http");
}

export function GalleryLightbox({ images, placeName }: GalleryLightboxProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.slice(0, 9).map((src, i) => (
          <button
            key={`img-${src.split('/').pop()}-${i}`}
            type="button"
            onClick={() => openLightbox(i)}
            className="group relative block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
          >
            <div className="relative aspect-square rounded-md overflow-hidden">
              <Image
                src={src}
                alt={`Photo ${i + 1} — ${placeName}`}
                fill
                className="object-cover transition group-hover:scale-105"
                unoptimized={isExternal(src)}
                sizes="200px"
              />
              {/* Overlay pour indiquer que c'est cliquable */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <Lightbox
        images={images}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        initialIndex={selectedImageIndex}
      />
    </>
  );
}
