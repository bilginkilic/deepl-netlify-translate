import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCouple } from "@/lib/auth";
import { createWeddingSchema } from "@/lib/validations";
import { buildWeddingSlug } from "@/lib/slug";

export async function POST(request: Request) {
  const session = await requireCouple();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createWeddingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const slug = buildWeddingSlug(parsed.data.title);
    const wedding = await db.wedding.create({
      data: {
        coupleUserId: session.user.id,
        title: parsed.data.title,
        slug,
        date: new Date(parsed.data.date),
        venueName: parsed.data.venueName,
        venueAddress: parsed.data.venueAddress,
        venueCity: parsed.data.venueCity,
        venuePostcode: parsed.data.venuePostcode,
        description: parsed.data.description,
        schedule: parsed.data.schedule ?? [],
        settings: { currency: "GBP", locale: "en-GB" },
      },
    });

    return NextResponse.json({ wedding }, { status: 201 });
  } catch (error) {
    console.error("create wedding", error);
    return NextResponse.json({ error: "Failed to create wedding" }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireCouple();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weddings = await db.wedding.findMany({
    where: { coupleUserId: session.user.id },
    orderBy: { date: "asc" },
    include: {
      _count: { select: { guests: true, photos: true } },
    },
  });

  return NextResponse.json({ weddings });
}
