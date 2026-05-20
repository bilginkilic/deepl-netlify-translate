import { z } from "zod";

export const createWeddingSchema = z.object({
  title: z.string().min(3).max(120),
  date: z.string().min(1),
  venueName: z.string().max(200).optional(),
  venueAddress: z.string().max(500).optional(),
  venueCity: z.string().max(100).optional(),
  venuePostcode: z.string().max(12).optional(),
  description: z.string().max(5000).optional(),
  schedule: z
    .array(
      z.object({
        time: z.string(),
        label: z.string(),
      })
    )
    .optional(),
});

export const inviteGuestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  partySize: z.number().int().min(1).max(20).optional(),
});

export const rsvpSchema = z.object({
  rsvpStatus: z.enum(["ATTENDING", "DECLINED", "MAYBE"]),
  partySize: z.number().int().min(1).max(20).optional(),
  dietaryNotes: z.string().max(500).optional(),
  name: z.string().min(1).max(120).optional(),
  inviteToken: z.string().optional(),
});

export const messageSchema = z.object({
  weddingId: z.string().cuid(),
  guestId: z.string().cuid().optional(),
  type: z.enum(["TEXT", "VIDEO"]),
  body: z.string().max(5000).optional(),
  contentUrl: z.string().url().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
