// app/api/avatar/[userId]/route.ts
import { NextResponse, NextRequest } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { PrismaClient } from "@/lib/generated/prisma";

export const runtime = "nodejs";

declare global {
  // store PrismaClient in a global to prevent multiple instances during hot-reload in dev
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

function contentTypeFromExt(ext: string) {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function cacheHeaders() {
  return {
    "Cache-Control":
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
  };
}

function toDiceBearUrl(seed: string, size?: string) {
  const s = Number(size) > 0 ? `&size=${Number(size)}` : "";
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    seed
  )}${s}`;
}

function isAbsoluteUrl(u?: string | null) {
  return !!u && /^https?:\/\//i.test(u);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ userId: string }> } // <-- Promise ici
) {
  const { userId } = await ctx.params; // <-- et await ici

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, email: true, name: true },
  });

  if (!user) {
    const url = toDiceBearUrl("User", "256");
    return NextResponse.redirect(url, {
      status: 302,
      headers: { ...cacheHeaders(), "X-Avatar-Source": "generated" },
    });
  }

  if (isAbsoluteUrl(user.image)) {
    return NextResponse.redirect(user.image as string, {
      status: 302,
      headers: { ...cacheHeaders(), "X-Avatar-Source": "url" },
    });
  }

  if (user.image) {
    const rel = user.image.startsWith("/") ? user.image.slice(1) : user.image;
    const filePath = path.join(process.cwd(), "public", rel);
    try {
      const file = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      return new NextResponse(new Uint8Array(file), {
        status: 200,
        headers: {
          "Content-Type": contentTypeFromExt(ext),
          ...cacheHeaders(),
          "X-Avatar-Source": "local",
        },
      });
    } catch {
      // on tombera sur le fallback ci-dessous
    }
  }

  if (user.email) {
    const crypto = await import("node:crypto");
    const md5 = crypto
      .createHash("md5")
      .update(user.email.trim().toLowerCase())
      .digest("hex");
    const gravatar = `https://www.gravatar.com/avatar/${md5}?s=256&d=identicon`;
    return NextResponse.redirect(gravatar, {
      status: 302,
      headers: { ...cacheHeaders(), "X-Avatar-Source": "gravatar" },
    });
  }

  const dicebear = toDiceBearUrl(user.name || "User", "256");
  return NextResponse.redirect(dicebear, {
    status: 302,
    headers: { ...cacheHeaders(), "X-Avatar-Source": "generated" },
  });
}

export async function HEAD(
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> } // <-- même signature
) {
  const res = await GET(req, ctx);
  return new NextResponse(null, { status: res.status, headers: res.headers });
}
