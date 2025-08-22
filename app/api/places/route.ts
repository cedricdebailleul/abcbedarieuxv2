import { PLACES_ROOT } from "@/lib/path";
import { promises as fsp } from "node:fs";

interface DataToCreate {
  logo?: string;
  coverImage?: string;
  images?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

function collectTempSlugs(data: DataToCreate): string[] {
  const urls = [
    typeof data.logo === "string" ? data.logo : undefined,
    typeof data.coverImage === "string" ? data.coverImage : undefined,
    ...(Array.isArray(data.images) ? data.images : []),
  ].filter(Boolean) as string[];

  // extrait le dossier après /uploads/places/
  const temps = new Set<string>();
  for (const u of urls) {
    const m = u.match(/\/uploads\/places\/([^/]+)/i);
    if (m && m[1] && m[1].startsWith("temp-")) {
      temps.add(m[1]);
    }
  }
  return Array.from(temps);
}

function rewriteUrlFromTemp(url: string, tempSlug: string, finalSlug: string) {
  return url.replace(
    new RegExp(`/uploads/places/${tempSlug}/`, "i"),
    `/uploads/places/${finalSlug}/`
  );
}

async function safeRenameOrCopy(src: string, dest: string) {
  try {
    await fsp.rename(src, dest); // même volume → instantané
  } catch {
    // fallback: copie récursive puis suppression
    await fsp.cp(src, dest, { recursive: true });
    await fsp.rm(src, { recursive: true, force: true });
  }
}

export async function moveTemporaryFiles(
  dataToCreate: DataToCreate,
  finalSlug: string
) {
  const tempSlugs = collectTempSlugs(dataToCreate);
  if (tempSlugs.length === 0) return;

  const finalPath = PLACES_ROOT(finalSlug);
  await fsp.mkdir(finalPath, { recursive: true });

  for (const tempSlug of tempSlugs) {
    const tempPath = PLACES_ROOT(tempSlug);

    // si le dossier temp n'existe plus, on passe
    try {
      const stat = await fsp.stat(tempPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    // déplace tout le dossier temp → slug
    await safeRenameOrCopy(tempPath, finalPath);

    // réécrit les URLs dans dataToCreate (temp → slug)
    if (typeof dataToCreate.logo === "string") {
      dataToCreate.logo = rewriteUrlFromTemp(
        dataToCreate.logo,
        tempSlug,
        finalSlug
      );
    }
    if (typeof dataToCreate.coverImage === "string") {
      dataToCreate.coverImage = rewriteUrlFromTemp(
        dataToCreate.coverImage,
        tempSlug,
        finalSlug
      );
    }
    if (Array.isArray(dataToCreate.images)) {
      dataToCreate.images = dataToCreate.images.map((u) =>
        rewriteUrlFromTemp(u, tempSlug, finalSlug)
      );
    }

    // si un résidu “tempSlug” a été fusionné dans finalPath, on tente un nettoyage
    // (sécurisé, sans erreur si déjà supprimé)
    await fsp.rm(tempPath, { recursive: true, force: true }).catch(() => {});
  }
}
