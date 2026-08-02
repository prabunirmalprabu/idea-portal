# Idea Portal

A working idea-management and roadmap portal, in the spirit of Aha!'s Ideas
portal: customers submit and vote on ideas, and you triage them onto a public
Now / Next / Later roadmap. It is **not** a licensed copy of Aha! — it's a
purpose-built app that covers the same core workflow: capture, vote, triage,
publish.

Ideas and roadmap items are stored in a Smartsheet sheet (already created for
you — see below), so everything you and your customers do in the app shows up
in Smartsheet too, and vice versa.

## What's included

- **`/ideas`** — public board. Anyone with the link can submit an idea and
  upvote existing ones (one vote per browser, enforced client-side).
- **`/roadmap`** — public Now / Next / Later view of whatever you've marked
  as planned.
- **`/admin`** — password-gated page for you and your team: triage incoming
  ideas (change status/timeframe/category) and add roadmap items directly,
  without going through the public form.

## The Smartsheet sheet

A sheet called **"Idea Portal - Ideas"** has already been created for you in
your "Platform Services (Prabu)" workspace:
https://app.smartsheet.com/sheets/95Jq78pWhVghjF2RRrR77hq65GPPgfvJ9pmxgG81

Columns: Idea, Description, Submitter Name, Submitter Email, Votes, Status
(New / Under Review / Planned / In Progress / Shipped / Not Planned),
Timeframe (Backlog / Now / Next / Later), Category (Feature / Improvement /
Integration / Bug / Other), Source (Customer / Internal). Each row's
Smartsheet-native "created" timestamp is used as the submission date, so
there's no separate date column to manage.

You can open the sheet any time in Smartsheet to browse, filter, or edit
ideas by hand — the app and Smartsheet stay in sync since they read/write the
same sheet via the Smartsheet API.

## One-time setup

**1. Create a Smartsheet API access token (no admin rights needed).**
Your Cowork session's Smartsheet connection is tied to this chat and can't be
used by a separately hosted web app. Any Smartsheet user can generate their
own personal access token for their own account — this does not require
workspace admin/owner permissions:

- In Smartsheet, click your avatar → **Personal Settings** → **API Access**.
- Click **Generate new access token**, name it "Idea Portal", copy it.
- This is your `SMARTSHEET_ACCESS_TOKEN`. Treat it like a password — anyone
  with it can read/write anything your Smartsheet account can access.

**2. Get the sheet ID.**
- The sheet was created with ID `8502987331686276` — that's your
  `SMARTSHEET_SHEET_ID`, already filled in below.
- If you ever recreate the sheet, get the ID via **File → Properties** in
  Smartsheet, or from the sheet's URL.

**3. Make sure the token's account can access the sheet.**
- The access token authenticates as whichever Smartsheet user generated it.
  If that's you, and the sheet above is already in your workspace, you're
  set. If someone else will run the deployed app, share the sheet with them
  in Smartsheet first (Share icon → add their email → Editor access), then
  have them generate their own token.

**4. Pick an admin password.**
- Any string you like — this is what protects `/admin`. This is a single
  shared password, good enough to keep the public out but not a substitute
  for real per-user auth if several people need separate logins (see
  Limitations below).

## Environment variables

| Variable | Where it's used | Example |
|---|---|---|
| `SMARTSHEET_ACCESS_TOKEN` | Server-side Smartsheet API calls | `abcd1234...` |
| `SMARTSHEET_SHEET_ID` | Which Smartsheet sheet to read/write | `8502987331686276` |
| `ADMIN_PASSWORD` | Gates the `/admin` page | anything strong |

Copy `.env.example` to `.env.local` for local development and fill in real
values. Never commit `.env.local`.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the three values above
npm run dev
```

Open http://localhost:3000 — it redirects to `/ideas`.

## Deploy it (Vercel is the easiest path)

1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. In the project's **Settings → Environment Variables**, add
   `SMARTSHEET_ACCESS_TOKEN`, `SMARTSHEET_SHEET_ID`, and `ADMIN_PASSWORD`.
4. Deploy. Vercel gives you a public URL — that's your portal.

Any other Node host (Render, Railway, your own server) works too: run
`npm run build` then `npm run start`, with the same three environment
variables set.

## Limitations to know about before you go live

- **Vote de-duplication is per-browser** (via `localStorage`), not per
  account. It stops casual double-voting but a determined user could clear
  storage or use another browser to vote again. If vote integrity matters a
  lot, add real customer accounts or email verification before counting a
  vote.
- **Admin auth is a single shared password**, not per-person accounts. Fine
  for one or two people; if more of your team need individual logins with an
  audit trail, swap this for something like NextAuth or your SSO provider.
- **No spam/rate limiting yet** on public idea submission. Before pointing a
  large external audience at this, consider adding a CAPTCHA (e.g.
  Cloudflare Turnstile) or a submission rate limit.
- **No file attachments or comments** on ideas — Aha!'s portal supports
  both; this MVP focuses on submit → vote → triage → roadmap. Both would be
  straightforward to add as new Smartsheet columns plus a couple of UI
  pieces, if you want them next.
- **The access token authenticates as one Smartsheet user.** All writes the
  app makes (new ideas, votes, triage updates) will show up as made by
  whoever generated the token, not by the actual customer submitting the
  idea — Smartsheet's API has no concept of an anonymous public writer.
