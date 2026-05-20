"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GdprConsentModal } from "@/components/gdpr-consent-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function OnboardingPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [consented, setConsented] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function resolveGuest() {
    if (!token) {
      setFeedback("Missing invite token. Open the link from your invitation email.");
      return null;
    }
    const res = await fetch(
      `/api/weddings/slug/${params.slug}/guest?token=${encodeURIComponent(token)}`
    );
    if (!res.ok) {
      setFeedback("Guest not found for this invite.");
      return null;
    }
    const data = await res.json();
    setGuestId(data.guest.id);
    return data.guest.id as string;
  }

  async function submitPhoto() {
    setLoading(true);
    setFeedback("");
    const id = guestId ?? (await resolveGuest());
    if (!id || !photoUrl) {
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/guests/${id}/reference-photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referencePhotoUrl: photoUrl,
        consentAccepted: consented,
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error ?? "Upload failed");
      return;
    }
    setFeedback(data.message ?? "Saved!");
  }

  if (declined) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>You can still browse the gallery manually without facial recognition.</p>
        <Link href={`/weddings/${params.slug}/photos`} className="mt-4 inline-block text-primary underline">
          View photos
        </Link>
      </main>
    );
  }

  return (
    <>
      {!consented && (
        <GdprConsentModal
          onAccept={() => setConsented(true)}
          onDecline={() => setDeclined(true)}
        />
      )}
      <main className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Find yourself in the photos</CardTitle>
            <CardDescription>
              Upload a clear selfie so we can tag you in wedding pictures (optional, GDPR-safe).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL (S3 upload — Phase 2 presigned URLs)</Label>
              <Input
                id="photoUrl"
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                disabled={!consented}
              />
            </div>
            {feedback && <p className="text-sm">{feedback}</p>}
            <Button onClick={submitPhoto} disabled={!consented || loading} className="w-full">
              {loading ? "Saving…" : "Save reference photo"}
            </Button>
            <Link
              href={`/weddings/${params.slug}`}
              className="block text-center text-sm text-primary underline"
            >
              Back to wedding page
            </Link>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
