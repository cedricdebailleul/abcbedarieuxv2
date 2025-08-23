import { PLACES_ROOT } from "@/lib/path";
import { promises as fsp } from "node:fs";
import { join } from "node:path";

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

  const temps = new Set<string>();
  for (const u of urls) {
    const m = u.match(/\/uploads\/places\/([^/]+)/i);
    if (m && m[1] && m[1].startsWith("temp-")) temps.add(m[1]);
  }
  return [...temps];
}

function rewriteUrlFromTemp(url: string, tempSlug: string, finalSlug: string) {
  return url.replace(
    new RegExp(`/uploads/places/${tempSlug}/`, "i"),
    `/uploads/places/${finalSlug}/`
  );
}

async function pathExists(p: string) {
  try {
    await fsp.stat(p);
    return true;
  } catch {
    return false;
  }
}

// Déplace/merge une entrée (fichier OU sous-dossier) vers sa destination.
// Essaie rename -> sinon copie puis supprime la source.
async function moveEntry(src: string, dest: string) {
  try {
    await fsp.rename(src, dest);
  } catch {
    // dest peut déjà exister -> on force la copie/merge
    await fsp.cp(src, dest, { recursive: true, force: true });
    await fsp.rm(src, { recursive: true, force: true });
  }
}

// Merge le contenu de srcDir dans destDir (sans imbriquer un niveau)
async function mergeDirContents(srcDir: string, destDir: string) {
  await fsp.mkdir(destDir, { recursive: true });
  const entries = await fsp.readdir(srcDir, { withFileTypes: true });

  for (const ent of entries) {
    const from = join(srcDir, ent.name);
    const to = join(destDir, ent.name);
    await moveEntry(from, to);
  }
}

export async function moveTemporaryFiles(
  dataToCreate: DataToCreate,
  finalSlug: string
) {
  const tempSlugs = collectTempSlugs(dataToCreate);
  if (tempSlugs.length === 0) return;

  const finalPath = PLACES_ROOT(finalSlug);

  for (const tempSlug of tempSlugs) {
    const tempPath = PLACES_ROOT(tempSlug);

    // Sauter si le dossier n’existe plus
    try {
      const st = await fsp.stat(tempPath);
      if (!st.isDirectory()) continue;
    } catch {
      continue;
    }

    const hasFinal = await pathExists(finalPath);

    if (!hasFinal) {
      // Premier dossier temp : on tente un rename complet (atomique & rapide)
      try {
        await fsp.rename(tempPath, finalPath);
      } catch {
        // Si le rename complet échoue (cross-device, permissions, course condition),
        // on crée finalPath et on merge le contenu
        await mergeDirContents(tempPath, finalPath);
        await fsp
          .rm(tempPath, { recursive: true, force: true })
          .catch(() => {});
      }
    } else {
      // finalPath existe déjà : on MERGE le contenu du temp dedans
      await mergeDirContents(tempPath, finalPath);
      await fsp.rm(tempPath, { recursive: true, force: true }).catch(() => {});
    }

    // Réécrire les URLs une fois le contenu fusionné
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
  }
}
