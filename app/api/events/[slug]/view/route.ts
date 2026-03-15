import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "";
    const userAgent = request.headers.get("user-agent") || "";
    const referer = (request.headers.get("referer") || "").substring(0, 255);

    if (ipAddress) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existing = await prisma.eventView.findFirst({
        where: {
          eventId: event.id,
          ipAddress,
          createdAt: { gte: tenMinutesAgo },
        },
      });
      if (existing) {
        return NextResponse.json({ success: true });
      }
    }

    await prisma.eventView.create({
      data: { eventId: event.id, ipAddress, userAgent, referer },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur enregistrement vue événement:", error);
    return NextResponse.json({ success: false });
  }
}
