---
name: wedding-invitation-system
description: Builds or updates the Wedding Invitation System project. Use when the user mentions wedding invitation, wedding RSVP, digital invitation, invitation management, guest responses, event schedule, wedding landing page, or files under public/wedding-invitation-system.
disable-model-invocation: true
---

# Wedding Invitation System

## When this applies

Follow this skill when implementing, fixing, or extending the **Wedding
Invitation System** project in this repository.

## Project layout

Source lives in:

```text
public/wedding-invitation-system/
├── index.html
├── README.md
└── assets/
    ├── app.js
    └── styles.css
```

The project is served as a static sub-application from the current Netlify
`public` directory:

```text
/wedding-invitation-system/
```

## Current technical scope

- Framework-free HTML, CSS, and JavaScript.
- Guest-facing wedding invitation page.
- Event details, couple story, schedule, location, and RSVP sections.
- RSVP form data is stored in `localStorage` for the initial demo.
- Development-only RSVP response table previews the data shape for a future
  backend.

## Product direction

Keep the project focused on a configurable digital wedding invitation system:

1. Editable couple and event information.
2. Invitation themes and visual customization.
3. Guest RSVP collection.
4. Guest management and response tracking.
5. Future backend persistence for RSVP data.
6. Optional guest-specific invitation links.

## Implementation requirements

- Keep all user-facing copy in English unless the product owner asks otherwise.
- Preserve the static deployment path unless the hosting strategy changes.
- Avoid adding a frontend framework until the project needs routing, state
  management, or admin-side complexity that justifies it.
- Do not commit real guest data, API keys, venue-private details, or production
  credentials.
- Treat `localStorage` as demo-only persistence; production RSVP data should go
  through a server-side API.
- Use accessible form labels, semantic HTML sections, and mobile-friendly CSS.

## Verification checklist

1. Open `/wedding-invitation-system/` from a local static server.
2. Confirm the hero, details, story, schedule, location, and RSVP sections render.
3. Submit an RSVP and verify it appears in the local preview table.
4. Refresh the page and verify demo RSVP data persists from `localStorage`.
5. Confirm layout remains usable on mobile widths.
