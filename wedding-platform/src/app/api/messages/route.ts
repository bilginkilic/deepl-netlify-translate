import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messageSchema } from "@/lib/validations";
import { MessageType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.type === "TEXT" && !parsed.data.body) {
      return NextResponse.json({ error: "body required for text messages" }, { status: 400 });
    }

    if (parsed.data.type === "VIDEO" && !parsed.data.contentUrl) {
      return NextResponse.json(
        { error: "contentUrl required for video messages" },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        weddingId: parsed.data.weddingId,
        guestId: parsed.data.guestId,
        type: parsed.data.type as MessageType,
        body: parsed.data.body,
        contentUrl: parsed.data.contentUrl,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("message", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const weddingId = new URL(request.url).searchParams.get("weddingId");
  if (!weddingId) {
    return NextResponse.json({ error: "weddingId required" }, { status: 400 });
  }

  const messages = await db.message.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
    include: {
      guest: { select: { name: true } },
    },
  });

  return NextResponse.json({ messages });
}
