import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCouple } from "@/lib/auth";
import { inviteGuestSchema } from "@/lib/validations";
import { sendGuestInvite } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireCouple();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: weddingId } = await params;

  const wedding = await db.wedding.findFirst({
    where: { id: weddingId, coupleUserId: session.user.id },
  });
  if (!wedding) {
    return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = inviteGuestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const guest = await db.guest.upsert({
      where: {
        weddingId_email: {
          weddingId,
          email: parsed.data.email,
        },
      },
      create: {
        weddingId,
        email: parsed.data.email,
        name: parsed.data.name,
        partySize: parsed.data.partySize ?? 1,
      },
      update: {
        name: parsed.data.name,
        partySize: parsed.data.partySize ?? 1,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/weddings/${wedding.slug}?token=${guest.inviteToken}`;

    await sendGuestInvite({
      to: guest.email,
      guestName: guest.name,
      weddingTitle: wedding.title,
      inviteUrl,
    });

    return NextResponse.json({ guest, inviteUrl }, { status: 201 });
  } catch (error) {
    console.error("invite guest", error);
    return NextResponse.json({ error: "Failed to add guest" }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: Params) {
  const session = await requireCouple();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: weddingId } = await params;

  const wedding = await db.wedding.findFirst({
    where: { id: weddingId, coupleUserId: session.user.id },
  });
  if (!wedding) {
    return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
  }

  const guests = await db.guest.findMany({
    where: { weddingId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ guests });
}
