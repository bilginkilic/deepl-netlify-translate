import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LandingHero } from "@/components/landing-hero";
import { FeatureGrid } from "@/components/feature-grid";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <LandingHero />

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center font-serif text-3xl font-semibold">
            Everything in one platform
          </h2>
          <FeatureGrid />
        </section>

        <section className="bg-muted/50 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-semibold">How it works</h2>
            <ol className="mt-8 space-y-4 text-left text-muted-foreground">
              <li>
                <strong className="text-foreground">1.</strong> Create your wedding profile
                and send digital invites.
              </li>
              <li>
                <strong className="text-foreground">2.</strong> Guests RSVP and optionally
                register a selfie for photo matching.
              </li>
              <li>
                <strong className="text-foreground">3.</strong> Upload bulk photos; guests
                are auto-tagged and notified.
              </li>
              <li>
                <strong className="text-foreground">4.</strong> Relive the day on a
                timeline and collect messages for the couple.
              </li>
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
