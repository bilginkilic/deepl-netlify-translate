"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Props = {
  onAccept: () => void;
  onDecline: () => void;
};

export function GdprConsentModal({ onAccept, onDecline }: Props) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Facial recognition consent</CardTitle>
          <CardDescription>
            Under UK GDPR, we need your explicit consent before processing your photo for
            automatic tagging in wedding pictures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>Your selfie is used only to find you in event photos.</li>
            <li>Face data is stored temporarily and deleted after matching.</li>
            <li>You can request full data deletion at any time.</li>
          </ul>
          <p>
            Read our{" "}
            <Link href="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => {
                onAccept();
                setOpen(false);
              }}
            >
              I consent
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onDecline();
                setOpen(false);
              }}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
