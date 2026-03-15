import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const place = await prisma.place.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!place) {
      return NextResponse.json({ error: "Place non trouvée" }, { status: 404 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "";
    const userAgent = request.headers.get("user-agent") || "";
    const referer = (request.headers.get("referer") || "").substring(0, 255);

    if (ipAddress) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existing = await prisma.placeView.findFirst({
        where: {
          placeId: place.id,
          ipAddress,
          createdAt: { gte: tenMinutesAgo },
        },
      });
      if (existing) {
        return NextResponse.json({ success: true });
      }
    }

    await prisma.placeView.create({
      data: { placeId: place.id, ipAddress, userAgent, referer },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur enregistrement vue place:", error);
    return NextResponse.json({ success: false });
  }
}
