import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteGuestFaceData } from "@/lib/rekognition";

type Params = { params: Promise<{ id: string }> };

/** GDPR right to erasure */
export async function DELETE(_request: Request, { params }: Params) {
  const { id: guestId } = await params;

  try {
    const guest = await db.guest.findUnique({ where: { id: guestId } });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    await deleteGuestFaceData(guestId);

    await db.photoTag.deleteMany({ where: { guestId } });
    await db.message.deleteMany({ where: { guestId } });
    await db.guest.delete({ where: { id: guestId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("guest data erasure", error);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
