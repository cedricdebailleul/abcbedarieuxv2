import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import mime from "mime";

export const runtime = "nodejs"; // impératif

const UPLOADS_ROOT =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const rel = path.join(...params.path);
  if (rel.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_ROOT, rel);
  try {
    const file = await fs.readFile(filePath);
    const type = mime.lookup(filePath) || "application/octet-stream";
    const body = new Uint8Array(file);
    return new NextResponse(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
