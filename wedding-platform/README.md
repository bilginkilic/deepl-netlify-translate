# Together — Wedding Invitation & Photo Sharing Platform

UK-focused wedding platform: digital invitations, RSVP tracking, bulk photo sharing, GDPR-compliant guest face matching, and guest messages.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + custom UI components
- **Prisma** + PostgreSQL
- **NextAuth.js** (email/password + optional Google)
- **AWS Rekognition** + S3 (Phase 3) · **BullMQ** + Redis (Phase 2–3)
- **Stripe UK** (Phase 5)

## Quick start

```bash
cd wedding-platform
cp .env.example .env
# Edit DATABASE_URL and NEXTAUTH_SECRET

npm install
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development phases

| Phase | Features |
|-------|----------|
| **1** (current) | Weddings, invites, RSVP, public pages, dashboard, messages API |
| **2** | S3 bulk upload, gallery, presigned URLs, Redis queue |
| **3** | AWS Rekognition auto-tagging, guest selfie onboarding |
| **4** | Video messages, timeline UI, photo stickers/captions |
| **5** | GBP gift registry, UK vendors, Stripe payments |

## Key routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing |
| `/register` | Couple registration |
| `/weddings/[slug]` | Public wedding + RSVP |
| `/weddings/[slug]/photos` | Gallery |
| `/weddings/[slug]/messages` | Guest messages |
| `/onboarding/[slug]?token=` | Guest selfie + GDPR consent |
| `/dashboard` | Couple admin |

## API overview

See `.cursor/skills/wedding-invitation-platform-technical/SKILL.md` for full endpoint list.

## GDPR (UK)

- Consent required before facial data (`/onboarding`)
- `DELETE /api/guests/[id]/data` — right to erasure
- Face vectors deleted after matching (Phase 3 implementation)
- Privacy policy at `/privacy`

## Deploy

- **Vercel** — Next.js app
- **Railway / Supabase** — PostgreSQL
- **AWS eu-west-2** — S3 + Rekognition

## Cursor skills

- `.cursor/skills/wedding-invitation-platform/SKILL.md` — product overview
- `.cursor/skills/wedding-invitation-platform-technical/SKILL.md` — technical spec
