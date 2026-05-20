"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  weddingId: string;
  guestId?: string;
};

export function MessageForm({ weddingId, guestId }: Props) {
  const [type, setType] = useState<"TEXT" | "VIDEO">("TEXT");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFeedback("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weddingId,
        guestId,
        type,
        body: form.get("body"),
        contentUrl: form.get("contentUrl") || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setFeedback("Could not send message. Please try again.");
      return;
    }
    setFeedback("Thank you! Your message has been sent to the couple.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "TEXT" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("TEXT")}
            >
              Written note
            </Button>
            <Button
              type="button"
              variant={type === "VIDEO" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("VIDEO")}
            >
              Video link
            </Button>
          </div>
          {type === "TEXT" ? (
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" name="body" rows={5} required />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="contentUrl">Video URL (YouTube, Vimeo, etc.)</Label>
              <Input id="contentUrl" name="contentUrl" type="url" required />
            </div>
          )}
          {feedback && (
            <p className={`text-sm ${feedback.startsWith("Thank") ? "text-emerald-700" : "text-red-600"}`}>
              {feedback}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
