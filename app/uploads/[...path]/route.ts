// app/uploads/[...path]/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import mime from "mime";
import { UPLOADS_ROOT } from "@/lib/path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const relPath = path.join(...params.path);

  // anti-path traversal
  if (relPath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_ROOT, relPath);

  try {
    const file = await fs.readFile(filePath); // Buffer (Node)
    const type = mime.getType(filePath) || "application/octet-stream";

    // ✅ Convertit Buffer -> Uint8Array (BodyInit valide)
    const body = new Uint8Array(file);

    return new NextResponse(body, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
