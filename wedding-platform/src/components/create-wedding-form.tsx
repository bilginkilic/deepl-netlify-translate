"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateWeddingForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/weddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        date: form.get("date"),
        venueName: form.get("venueName"),
        venueAddress: form.get("venueAddress"),
        venueCity: form.get("venueCity"),
        venuePostcode: form.get("venuePostcode"),
        description: form.get("description"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create wedding");
      return;
    }
    const { wedding } = await res.json();
    router.push(`/dashboard?wedding=${wedding.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Wedding title</Label>
        <Input id="title" name="title" placeholder="Emma & James" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="venueName">Venue name</Label>
        <Input id="venueName" name="venueName" placeholder="The Orangery, Bath" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venueCity">City</Label>
          <Input id="venueCity" name="venueCity" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venuePostcode">Postcode</Label>
          <Input id="venuePostcode" name="venuePostcode" placeholder="BA1 2LS" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="venueAddress">Address</Label>
        <Input id="venueAddress" name="venueAddress" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description for guests</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating…" : "Create wedding"}
      </Button>
    </form>
  );
}
