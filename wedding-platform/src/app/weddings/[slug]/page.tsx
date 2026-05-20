import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatUkDate } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RsvpForm } from "@/components/rsvp-form";
import { Calendar, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function WeddingPublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;

  const wedding = await db.wedding.findUnique({
    where: { slug },
    include: { guests: true },
  });

  if (!wedding) notFound();

  const guest = token
    ? wedding.guests.find((g) => g.inviteToken === token)
    : wedding.guests[0];

  const schedule = (wedding.schedule as { time: string; label: string }[] | null) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/80 px-4 py-12 text-center sm:px-6">
        <p className="text-sm uppercase tracking-widest text-primary">You&apos;re invited</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">{wedding.title}</h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatUkDate(wedding.date)}
          </span>
          {wedding.venueName && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {wedding.venueName}
              {wedding.venueCity ? `, ${wedding.venueCity}` : ""}
            </span>
          )}
        </div>
        {wedding.description && (
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">{wedding.description}</p>
        )}
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
        {schedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order of the day</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {schedule.map((item) => (
                <div key={`${item.time}-${item.label}`} className="flex gap-4 border-b border-border/40 pb-2 last:border-0">
                  <span className="w-16 shrink-0 font-medium text-primary">{item.time}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>RSVP</CardTitle>
          </CardHeader>
          <CardContent>
            {guest ? (
              <RsvpForm guestId={guest.id} inviteToken={token} defaultName={guest.name} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Open your personal invite link from your email to RSVP.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <nav className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4 px-4 pb-12 text-sm">
        <Link href={`/weddings/${slug}/photos`} className="text-primary underline">
          Photo gallery
        </Link>
        <Link href={`/weddings/${slug}/messages`} className="text-primary underline">
          Leave a message
        </Link>
        {token && (
          <Link href={`/onboarding/${slug}?token=${token}`} className="text-primary underline">
            Guest photo registration
          </Link>
        )}
      </nav>

      <SiteFooter />
    </div>
  );
}
