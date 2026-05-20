import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id: guestId } = await params;

  const guest = await db.guest.findUnique({
    where: { id: guestId },
    include: { wedding: { select: { slug: true, title: true } } },
  });

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  const tags = await db.photoTag.findMany({
    where: { guestId },
    include: {
      photo: true,
    },
    orderBy: { photo: { takenAt: "asc" } },
  });

  return NextResponse.json({
    wedding: guest.wedding,
    photos: tags.map((t) => ({
      ...t.photo,
      confidenceScore: t.confidenceScore,
    })),
  });
}
