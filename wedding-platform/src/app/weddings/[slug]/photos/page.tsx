import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function WeddingPhotosPage({ params }: Props) {
  const { slug } = await params;
  const wedding = await db.wedding.findUnique({
    where: { slug },
    include: {
      photos: {
        orderBy: [{ takenAt: "asc" }, { createdAt: "asc" }],
        take: 48,
      },
    },
  });

  if (!wedding) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-8 text-center sm:px-6">
        <Link href={`/weddings/${slug}`} className="text-sm text-primary underline">
          ← {wedding.title}
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold">Wedding gallery</h1>
        <p className="mt-2 text-muted-foreground">
          {wedding.photos.length === 0
            ? "Photos will appear here after the couple uploads them."
            : `${wedding.photos.length} photos`}
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {wedding.photos.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Coming soon</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Register with your invite link and upload a selfie so we can find you in
              photos automatically (Phase 3).
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {wedding.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.s3Url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square overflow-hidden rounded-xl bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.s3Url}
                  alt={photo.caption ?? "Wedding photo"}
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
