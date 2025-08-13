import Image, { type ImageProps } from "next/image";

export default function SmartImage({ alt, src, ...props }: ImageProps) {
  const safeAlt = alt?.trim();
  if (!safeAlt) throw new Error("SmartImage: alt est obligatoire et explicite");
  const safeSrc =
    typeof src === "string" && !src.startsWith("http") && !src.startsWith("/") ? `/${src}` : src;
  return (
    <Image
      src={safeSrc}
      alt={safeAlt}
      loading="lazy"
      sizes={props.sizes ?? "(max-width: 768px) 100vw, 50vw"}
      {...props}
    />
  );
}
