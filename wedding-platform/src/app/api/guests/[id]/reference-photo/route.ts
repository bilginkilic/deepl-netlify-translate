import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { indexGuestFace } from "@/lib/rekognition";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: guestId } = await params;

  try {
    const body = await request.json();
    const { referencePhotoUrl, consentAccepted } = body as {
      referencePhotoUrl?: string;
      consentAccepted?: boolean;
    };

    if (!consentAccepted) {
      return NextResponse.json(
        { error: "Facial recognition consent required" },
        { status: 400 }
      );
    }

    if (!referencePhotoUrl) {
      return NextResponse.json(
        { error: "referencePhotoUrl required" },
        { status: 400 }
      );
    }

    const guest = await db.guest.update({
      where: { id: guestId },
      data: {
        referencePhotoUrl,
        consentFacialAt: new Date(),
      },
    });

    const indexed = await indexGuestFace({
      s3Key: referencePhotoUrl,
      guestId,
    });

    if (indexed?.faceId) {
      await db.guest.update({
        where: { id: guestId },
        data: { faceId: indexed.faceId },
      });
    }

    return NextResponse.json({
      guest,
      recognitionQueued: Boolean(indexed),
      message: indexed
        ? "Face indexed for matching"
        : "Reference saved; enable AWS Rekognition in Phase 3 for auto-tagging",
    });
  } catch (error) {
    console.error("reference-photo", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
