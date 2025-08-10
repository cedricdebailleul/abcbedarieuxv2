import { auth } from "@/lib/auth";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getProfileByUserId } from "@/actions/profile";

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
