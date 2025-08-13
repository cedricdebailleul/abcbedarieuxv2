import { headers } from "next/headers";

import { NextResponse } from "next/server";
import { getProfileByUserId } from "@/actions/profile";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileByUserId(session.user.id);

  return NextResponse.json({ profile });
}
