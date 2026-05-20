---
name: wedding-invitation-platform-technical
description: Technical spec for the UK Wedding Invitation & Photo Sharing Platform — Next.js 14, Prisma, NextAuth, AWS Rekognition/S3, BullMQ, Stripe UK. Use when implementing APIs, database, auth, photo jobs, or deployment for wedding-platform/.
disable-model-invocation: true
---

# Wedding Platform — Technical Specification

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14 App Router, Tailwind CSS, shadcn/ui, Framer Motion, Zustand |
| Forms | React Hook Form + Zod |
| Backend | Next.js API Routes (Node.js) |
| Database | PostgreSQL + Prisma |
| Storage | AWS S3 or Cloudflare R2 |
| Queue | BullMQ + Redis (photo processing) |
| Cache | Redis |
| Faces | AWS Rekognition (index, search, auto-tag; delete vectors after match) |
| Auth | NextAuth.js — email/password + Google; roles `couple` \| `guest` |
| Payments | Stripe (GBP, UK) — Phase 5 |
| Email | Resend or SendGrid |
| Deploy | Vercel (app), Railway/Supabase (DB), AWS (S3 + Rekognition) |

## Key tables (Prisma)

- `User` — couple or guest account
- `Wedding` — event, slug, venue, date, settings JSON
- `Guest` — wedding_id, user_id?, rsvp_status, reference_photo_url, face_id (temp)
- `Photo` — wedding_id, s3_url, taken_at, is_processed
- `PhotoTag` — photo_id, guest_id, confidence_score
- `Message` — type video \| text, content_url
- `GiftRegistryItem` — Phase 5

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/weddings` | Create wedding (couple) |
| GET | `/api/weddings/slug/[slug]` | Public wedding page data |
| POST | `/api/weddings/[id]/guests` | Add / invite guest |
| PATCH | `/api/guests/[id]/rsvp` | RSVP update |
| POST | `/api/guests/[id]/reference-photo` | Selfie for recognition |
| POST | `/api/weddings/[id]/photos/bulk` | Bulk upload (presigned URLs) |
| GET | `/api/guests/[id]/photos` | Photos tagged for guest |
| POST | `/api/messages` | Guest message to couple |
| GET | `/api/weddings/[id]/timeline` | Chronological photos |

## Frontend routes

- `/` — marketing landing
- `/weddings/[slug]` — public page (details, RSVP)
- `/weddings/[slug]/photos` — guest gallery
- `/weddings/[slug]/messages` — guest messages
- `/onboarding/[slug]` — guest registration + selfie + GDPR consent
- `/dashboard` — couple admin
- `/dashboard/guests`, `/dashboard/photos`
- `/privacy` — privacy policy (required)

## Env vars (see wedding-platform/.env.example)

`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, Google OAuth, `AWS_*`, `REDIS_URL`, `RESEND_API_KEY`, `STRIPE_*` (Phase 5).

## GDPR implementation notes

- Consent recorded on `Guest.consentFacialAt` before reference photo upload
- `lib/rekognition.ts` — index face; `lib/photo-jobs.ts` — BullMQ worker
- After job: delete S3 reference + clear `face_id` on guest
- `DELETE /api/guests/[id]/data` — right to erasure

## Conventions

- Use `src/lib/db.ts` singleton Prisma client
- Validate all API bodies with Zod
- UK date display: `en-GB` locale; currency `GBP`
- Slug: lowercase hyphenated from couple names + short id

## Phase gating in code

Services under `src/lib/` may no-op or return 501 until env configured (e.g. Rekognition without `AWS_REGION`). UI shows "coming soon" for Phase 4–5 features when flags off.
