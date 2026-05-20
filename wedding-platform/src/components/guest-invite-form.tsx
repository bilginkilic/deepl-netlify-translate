"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GuestInviteForm({ weddingId }: { weddingId: string }) {
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteUrl("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/weddings/${weddingId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        partySize: Number(form.get("partySize") || 1),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to invite guest");
      return;
    }
    const data = await res.json();
    setInviteUrl(data.inviteUrl);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Guest name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partySize">Party size</Label>
          <Input id="partySize" name="partySize" type="number" min={1} defaultValue={1} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Add guest & generate invite"}
        </Button>
      </form>
      {inviteUrl && (
        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="font-medium">Invite link (share or email):</p>
          <a href={inviteUrl} className="mt-2 block break-all text-primary underline">
            {inviteUrl}
          </a>
        </div>
      )}
    </div>
  );
}
