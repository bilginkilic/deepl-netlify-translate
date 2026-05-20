import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SiteFooter } from "@/components/site-footer";
import { MessageForm } from "@/components/message-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function WeddingMessagesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;

  const wedding = await db.wedding.findUnique({
    where: { slug },
    include: { guests: true },
  });

  if (!wedding) notFound();

  const guest = token ? wedding.guests.find((g) => g.inviteToken === token) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-8 text-center sm:px-6">
        <Link href={`/weddings/${slug}`} className="text-sm text-primary underline">
          ← {wedding.title}
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold">Messages for the couple</h1>
        <p className="mt-2 text-muted-foreground">
          Share a written note or video link — a keepsake they&apos;ll treasure.
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <MessageForm weddingId={wedding.id} guestId={guest?.id} />
      </main>
      <SiteFooter />
    </div>
  );
}
