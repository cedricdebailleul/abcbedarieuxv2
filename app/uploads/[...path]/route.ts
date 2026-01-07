// app/uploads/[...path]/route.ts
import { NextResponse } from "next/server";
import * as nodePath from "node:path";
import { promises as fs } from "node:fs";
import mime from "mime";
import { UPLOADS_ROOT } from "@/lib/path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> } // 👈 params est async
) {
  const { path } = await ctx.params; // 👈 on attend params
  const relPath = nodePath.join(...path);

  // Anti path traversal robuste
  const root = nodePath.resolve(UPLOADS_ROOT);
  const abs = nodePath.resolve(root, relPath);
  const rootWithSep = root.endsWith(nodePath.sep) ? root : root + nodePath.sep;
  if (!abs.startsWith(rootWithSep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(abs);
    if (stat.isDirectory()) {
      return NextResponse.json({ error: "Is a directory" }, { status: 404 });
    }

    const file = await fs.readFile(abs); // Buffer (Uint8Array)
    const type = mime.getType(abs) || "application/octet-stream";
    const body = new Uint8Array(file); // convert Node Buffer to a web-compatible Uint8Array

    return new NextResponse(body, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Si le fichier n'existe pas localement, on tente une redirection vers R2
    // C'est utile si le volume Docker a été perdu mais que les fichiers sont sur R2
    const r2Url = process.env.R2_PUBLIC_URL;
    if (r2Url) {
      // Normaliser le chemin pour l'URL (forward slashes)
      const urlPath = path.join(...(await ctx.params).path).replace(/\\/g, "/");
      return NextResponse.redirect(`${r2Url}/${urlPath}`);
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
