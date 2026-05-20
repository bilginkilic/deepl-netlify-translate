import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id: weddingId } = await params;

  const photos = await db.photo.findMany({
    where: { weddingId },
    orderBy: [{ takenAt: "asc" }, { createdAt: "asc" }],
    include: {
      tags: {
        include: { guest: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json({ timeline: photos });
}
