import Link from "next/link";
import { Heart } from "lucide-react";
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl text-foreground">
          <Heart className="h-5 w-5 fill-primary text-primary" />
          <span>Together</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/privacy"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
          >
            Privacy
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium hover:bg-accent"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
