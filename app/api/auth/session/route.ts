import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { safeUserCast } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(null);
    }


    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: safeUserCast(session.user).role,
        image: session.user.image,
      },
    });
  } catch (error) {
    console.error("Erreur session:", error);
    return NextResponse.json(null);
  }
}
