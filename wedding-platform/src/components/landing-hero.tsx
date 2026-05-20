"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/60 via-background to-background" />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-sm font-medium uppercase tracking-widest text-primary"
        >
          Wedding invitations &amp; memories — UK
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-serif text-4xl font-semibold leading-tight text-foreground sm:text-6xl"
        >
          Your wedding, one beautiful place
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          Invite guests, track RSVPs, share photos, and let everyone find themselves in
          the memories — easy, useful, and genuinely fun.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your wedding
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full border border-input bg-background px-8 text-base font-medium hover:bg-accent"
          >
            Couple sign in
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
