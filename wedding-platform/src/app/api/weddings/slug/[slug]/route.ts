import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;

  const wedding = await db.wedding.findUnique({
    where: { slug },
    include: {
      guests: {
        select: {
          id: true,
          name: true,
          rsvpStatus: true,
        },
      },
      _count: { select: { photos: true, messages: true } },
    },
  });

  if (!wedding) {
    return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
  }

  const { coupleUserId: _, ...publicWedding } = wedding;
  void _;

  return NextResponse.json({
    wedding: {
      ...publicWedding,
      guestCount: wedding._count,
    },
  });
}
