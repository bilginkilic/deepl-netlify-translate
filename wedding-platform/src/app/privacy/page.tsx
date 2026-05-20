import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6 prose prose-neutral">
        <h1 className="font-serif text-4xl font-semibold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 2026</p>

        <section className="mt-8 space-y-4 text-foreground">
          <h2 className="font-serif text-2xl">Who we are</h2>
          <p>
            Together provides wedding invitation and photo sharing services for couples
            and guests in the United Kingdom. We process personal data in accordance with
            UK GDPR and the Data Protection Act 2018.
          </p>

          <h2 className="font-serif text-2xl">Facial recognition</h2>
          <p>
            We only process facial data when you give explicit consent. Reference selfies
            and face vectors are used solely to match you in event photos. This data is
            deleted after matching completes.
          </p>

          <h2 className="font-serif text-2xl">Your rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, rectify, or erase your personal data</li>
            <li>Withdraw consent for facial processing at any time</li>
            <li>Request portability of your data</li>
            <li>Lodge a complaint with the ICO (ico.org.uk)</li>
          </ul>

          <h2 className="font-serif text-2xl">Data location</h2>
          <p>
            We host services in EU/UK regions (e.g. AWS eu-west-2 London) where possible.
          </p>

          <h2 className="font-serif text-2xl">Contact</h2>
          <p>
            For privacy requests, contact your wedding couple administrator or email
            privacy@together-wedding.example (replace with production address).
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
