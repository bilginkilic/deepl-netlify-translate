"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Heart,
  Mail,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Mail,
    title: "Digital invitations",
    description: "Beautiful wedding pages with RSVP tracking and guest list management.",
  },
  {
    icon: Camera,
    title: "Photo sharing",
    description: "Bulk uploads from your photographer; guests find and download their photos.",
  },
  {
    icon: Sparkles,
    title: "Smart guest tagging",
    description: "Guests upload a selfie; we match them in photos (GDPR-safe, consent-first).",
  },
  {
    icon: Heart,
    title: "Messages & timeline",
    description: "Video notes for the couple and a chronological wedding day timeline.",
  },
  {
    icon: Users,
    title: "Built for UK weddings",
    description: "GBP, UK venues, gift registry, and vendor integrations coming in Phase 5.",
  },
  {
    icon: Shield,
    title: "GDPR compliant",
    description: "Facial data deleted after matching. Hosted in EU/UK regions.",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="h-full border-none shadow-md">
            <CardHeader>
              <f.icon className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-xl">{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
