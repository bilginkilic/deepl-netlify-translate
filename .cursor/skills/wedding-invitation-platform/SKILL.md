---
name: wedding-invitation-platform
description: Wedding Invitation & Photo Sharing Platform for the UK market — digital invites, RSVP, guest photos, facial recognition tagging, messages, timeline. Use when the user mentions wedding invitation system, wedding platform, guest photo recognition, UK wedding app, or wedding-platform/ in this repo.
---

# Wedding Invitation & Photo Sharing Platform

## Product summary

Online, on-demand platform for UK couples: create a wedding event, send digital invitations, track RSVPs, bulk-upload wedding photos, auto-tag guests via facial recognition (GDPR-compliant), and collect guest messages. Mobile-first, fun, easy to use.

**Target market:** United Kingdom (GBP, UK venues, Stripe UK, GDPR).

## Repository layout

```
wedding-platform/          # Next.js 14 App Router application
├── prisma/schema.prisma   # PostgreSQL schema
├── src/app/               # Pages & API routes
├── src/components/        # UI (shadcn/ui)
├── src/lib/               # Auth, db, services (rekognition, queue, email)
└── README.md              # Setup, env vars, phases
```

## Core features (by phase)

| Phase | Scope |
|-------|--------|
| 1 | Wedding profile, digital invites, RSVP, guest list, public event page |
| 2 | Bulk photo upload, gallery, manual guest photo search |
| 3 | Facial recognition auto-tagging (AWS Rekognition, temp face data) |
| 4 | Video/text messages, wedding day timeline, stickers/captions |
| 5 | UK gift registry, vendor directory, Stripe GBP payments |

## Roles

- **Couple (admin):** create wedding, manage guests, upload photos, view messages
- **Guest:** RSVP, upload selfie for matching, view tagged photos, upload own photos, leave messages

## Response pipeline (photo tagging)

1. Guest uploads reference selfie → temporary S3 → Rekognition FaceId
2. Bulk photos uploaded → BullMQ jobs per photo
3. Rekognition match → `photo_tags` if confidence above threshold
4. Email guest when photos ready
5. Delete reference selfie + face vectors after processing (GDPR)

## UK / compliance

- Explicit consent before facial data processing
- Privacy policy + data retention + right to erasure
- Prefer AWS `eu-west-2` (London)
- GBP, UK address/venue fields, Stripe UK / PayPal

## Non-functional

- Mobile-first responsive UI
- Fast async photo processing (queue)
- Multi-tenant: many weddings concurrently

## Related skill

Technical stack, API list, and DB tables: `.cursor/skills/wedding-invitation-platform-technical/SKILL.md`
