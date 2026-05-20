import { requireCouple } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isQueueConfigured } from "@/lib/photo-jobs";
import { isRekognitionConfigured } from "@/lib/rekognition";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ wedding?: string }> };

export default async function DashboardPhotosPage({ searchParams }: Props) {
  const session = await requireCouple();
  if (!session) return null;

  const { wedding: weddingId } = await searchParams;

  const weddings = await db.wedding.findMany({
    where: { coupleUserId: session.user.id },
  });

  const activeId = weddingId ?? weddings[0]?.id;
  const wedding = weddings.find((w) => w.id === activeId);

  const photoCount = wedding
    ? await db.photo.count({ where: { weddingId: wedding.id } })
    : 0;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Photo management</CardTitle>
        <CardDescription>
          {wedding ? wedding.title : "Select a wedding from the dashboard"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">{photoCount}</strong> photos uploaded.
        </p>
        <p>
          Bulk upload API: <code>POST /api/weddings/:id/photos/bulk</code> with S3 URLs.
          Configure <code>AWS_S3_BUCKET</code> for production uploads.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Redis queue: {isQueueConfigured() ? "configured" : "not configured (Phase 2–3)"}</li>
          <li>
            AWS Rekognition:{" "}
            {isRekognitionConfigured() ? "configured" : "not configured (Phase 3)"}
          </li>
        </ul>
        <p>
          Timeline: <code>GET /api/weddings/{wedding?.id ?? ":id"}/timeline</code>
        </p>
      </CardContent>
    </Card>
  );
}
