import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCouple } from "@/lib/auth";
import { enqueuePhotoProcessing } from "@/lib/photo-jobs";
import { z } from "zod";

const bulkSchema = z.object({
  photos: z.array(
    z.object({
      s3Key: z.string(),
      s3Url: z.string().url(),
      takenAt: z.string().datetime().optional(),
      caption: z.string().max(500).optional(),
    })
  ),
});

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
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await db.$transaction(
      parsed.data.photos.map((p) =>
        db.photo.create({
          data: {
            weddingId,
            uploaderId: session.user.id,
            s3Key: p.s3Key,
            s3Url: p.s3Url,
            takenAt: p.takenAt ? new Date(p.takenAt) : undefined,
            caption: p.caption,
            isProcessed: false,
          },
        })
      )
    );

    await Promise.all(created.map((photo) => enqueuePhotoProcessing(photo.id)));

    return NextResponse.json(
      {
        photos: created,
        message:
          "Photos saved. Configure REDIS_URL and AWS for async face matching (Phase 3).",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("bulk photos", error);
    return NextResponse.json({ error: "Bulk upload failed" }, { status: 500 });
  }
}
