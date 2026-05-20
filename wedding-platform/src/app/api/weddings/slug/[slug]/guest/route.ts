import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const guest = await db.guest.findFirst({
    where: {
      inviteToken: token,
      wedding: { slug },
    },
    select: {
      id: true,
      name: true,
      email: true,
      rsvpStatus: true,
      consentFacialAt: true,
    },
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json({ guest });
}
