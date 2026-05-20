import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rsvpSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const token = parsed.data.inviteToken;
    const guest = await db.guest.findFirst({
      where: token ? { id, inviteToken: token } : { id },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const updated = await db.guest.update({
      where: { id },
      data: {
        rsvpStatus: parsed.data.rsvpStatus,
        partySize: parsed.data.partySize ?? guest.partySize,
        dietaryNotes: parsed.data.dietaryNotes,
        name: parsed.data.name ?? guest.name,
      },
    });

    return NextResponse.json({ guest: updated });
  } catch (error) {
    console.error("rsvp", error);
    return NextResponse.json({ error: "RSVP update failed" }, { status: 500 });
  }
}
