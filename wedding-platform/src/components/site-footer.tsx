import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm text-muted-foreground sm:px-6">
        <p>Together — Wedding invitations &amp; photo sharing for the UK</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <span aria-hidden>·</span>
          <span>GDPR compliant · Data hosted in EU/UK regions</span>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} Together. All rights reserved.</p>
      </div>
    </footer>
  );
}
