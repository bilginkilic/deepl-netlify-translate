import Link from "next/link";
import { requireCouple } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatUkDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireCouple();
  if (!session) return null;

  const weddings = await db.wedding.findMany({
    where: { coupleUserId: session.user.id },
    orderBy: { date: "asc" },
    include: {
      _count: { select: { guests: true, photos: true, messages: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Your weddings</h1>
          <p className="text-muted-foreground">Manage invitations, guests, and photos</p>
        </div>
        <Link href="/dashboard/weddings/new" className={cn(buttonVariants())}>
          Create wedding
        </Link>
      </div>

      {weddings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Together</CardTitle>
            <CardDescription>
              Create your first wedding to send invites and collect RSVPs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/weddings/new" className={cn(buttonVariants())}>
              Get started
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {weddings.map((w) => (
            <Card key={w.id}>
              <CardHeader>
                <CardTitle className="text-xl">{w.title}</CardTitle>
                <CardDescription>{formatUkDate(w.date)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{w._count.guests} guests</Badge>
                  <Badge variant="secondary">{w._count.photos} photos</Badge>
                  <Badge variant="secondary">{w._count.messages} messages</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/weddings/${w.slug}`}
                    target="_blank"
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    View public page
                  </Link>
                  <Link
                    href={`/dashboard/guests?wedding=${w.id}`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Manage guests
                  </Link>
                  <Link
                    href={`/dashboard/photos?wedding=${w.id}`}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    Photos
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
