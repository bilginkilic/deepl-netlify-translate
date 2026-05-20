import { requireCouple } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuestInviteForm } from "@/components/guest-invite-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ wedding?: string }> };

export default async function DashboardGuestsPage({ searchParams }: Props) {
  const session = await requireCouple();
  if (!session) return null;

  const { wedding: weddingId } = await searchParams;

  const weddings = await db.wedding.findMany({
    where: { coupleUserId: session.user.id },
    orderBy: { date: "asc" },
  });

  const activeId = weddingId ?? weddings[0]?.id;
  const wedding = weddings.find((w) => w.id === activeId);

  const guests = wedding
    ? await db.guest.findMany({
        where: { weddingId: wedding.id },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Invite guests</CardTitle>
        </CardHeader>
        <CardContent>
          {wedding ? (
            <GuestInviteForm weddingId={wedding.id} />
          ) : (
            <p className="text-sm text-muted-foreground">Create a wedding first.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guest list {wedding ? `— ${wedding.title}` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {guests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No guests yet.</p>
          ) : (
            <ul className="space-y-3">
              {guests.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-sm text-muted-foreground">{g.email}</p>
                  </div>
                  <Badge
                    variant={
                      g.rsvpStatus === "ATTENDING"
                        ? "success"
                        : g.rsvpStatus === "DECLINED"
                          ? "outline"
                          : "warning"
                    }
                  >
                    {g.rsvpStatus}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
