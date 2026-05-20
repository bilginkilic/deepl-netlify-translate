"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  guestId: string;
  inviteToken?: string;
  defaultName?: string;
};

export function RsvpForm({ guestId, inviteToken, defaultName }: Props) {
  const [status, setStatus] = useState<"ATTENDING" | "DECLINED" | "MAYBE">("ATTENDING");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/guests/${guestId}/rsvp`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rsvpStatus: status,
        name: form.get("name"),
        partySize: Number(form.get("partySize") || 1),
        dietaryNotes: form.get("dietaryNotes"),
        inviteToken,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Could not save RSVP");
      return;
    }
    setDone(true);
    setMessage("Thank you — your RSVP has been saved.");
  }

  if (done) {
    return <p className="rounded-lg bg-accent/50 p-4 text-center text-secondary-foreground">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="space-y-2">
        <Label>Will you attend?</Label>
        <div className="flex flex-wrap gap-2">
          {(["ATTENDING", "MAYBE", "DECLINED"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={status === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(s)}
            >
              {s === "ATTENDING" ? "Yes" : s === "MAYBE" ? "Maybe" : "No"}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="partySize">Party size</Label>
        <Input id="partySize" name="partySize" type="number" min={1} max={20} defaultValue={1} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dietaryNotes">Dietary requirements (optional)</Label>
        <Textarea id="dietaryNotes" name="dietaryNotes" rows={2} />
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Submit RSVP"}
      </Button>
    </form>
  );
}
