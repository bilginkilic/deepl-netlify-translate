import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCouple } from "@/lib/auth";
import { Heart } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCouple();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-serif text-lg">
            <Heart className="h-4 w-4 fill-primary text-primary" />
            Together
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:text-primary">
              Overview
            </Link>
            <Link href="/dashboard/guests" className="hover:text-primary">
              Guests
            </Link>
            <Link href="/dashboard/photos" className="hover:text-primary">
              Photos
            </Link>
            <Link href="/dashboard/weddings/new" className="hover:text-primary">
              New wedding
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
