# Wedding Invitation System

This directory contains the first standalone scaffold for the **Wedding Invitation
System** project.

## Current scope

- Public wedding invitation landing page
- Event summary, couple story, schedule, and location sections
- RSVP form for guest responses
- Local demo persistence with `localStorage`
- Development-only RSVP table to preview saved responses

## Run locally

From the repository root:

```bash
python3 -m http.server 8080 --directory public
```

Then open:

```text
http://localhost:8080/wedding-invitation-system/
```

## Planned next steps

1. Move invitation content into editable configuration.
2. Add invitation themes and couple-specific branding.
3. Replace local RSVP storage with an API-backed persistence layer.
4. Add admin authentication for managing guests and responses.
5. Add guest-specific invitation links and attendance limits.

## Notes

The first version is intentionally framework-free and static. This keeps the
project easy to deploy inside the current Netlify `public` directory while the
product flow is shaped.
