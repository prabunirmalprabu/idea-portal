# Idea Portal

A working idea-management and roadmap portal, in the spirit of Aha!'s Ideas
portal: customers submit and vote on ideas, and you triage them onto a public,
quarter-by-quarter roadmap. It is **not** a licensed copy of Aha! — it's a
purpose-built app that covers the same core workflow: capture, vote, triage,
publish.

Ideas and roadmap items are stored in a Smartsheet sheet (already created for
you — see below), so everything you and your customers do in the app shows up
in Smartsheet too, and vice versa.

## What's included

- **`/ideas`** — public board. Anyone with the link can submit an idea and
  upvote existing ones (one vote per browser, enforced client-side).
- **`/roadmap`** — public, graphical roadmap with a Product filter (chips
  above the grid) and a column per release quarter
  (e.g. Q3 2026, Q4 2026...), each showing the items planned for it, with a
  status-colored bar and a bar chart across the top showing relative volume
  per quarter. Items marked "Shipped" show their release notes right on the
  card.
- **`/admin`** — password-gated page for you and your team:
  - Triage incoming ideas: change status, release quarter, category, product,
    and add release notes, all inline.
  - Add roadmap items directly, without going through the public form.
  - **Manage field options** — add new Status, Release Quarter, Category, or
    Product values yourself, any time, without touching code. New quarters
    (e.g. "Q2 2028" once you're that far out) or new products just get typed
    in and are immediately available everywhere.
  - **Import from Excel** — download a template (correct headers, one
    example row), fill it in, and upload it to bulk-create roadmap items
    instead of adding them one at a time.
  - **Delete** any idea or roadmap item, with a confirmation prompt.
  - **Timeline (`/admin/timeline`)** — its own dedicated page (reachable via
    the "Open Timeline" button in Admin) listing every roadmap item as a
    sortable table, ordered by start date (falling back to the start of its
    Release Quarter if no explicit date is set). Filter by Product and/or
    Status using the chip toggles above the table. Status, Start Date, and
    Target Date are all editable right in the table and save automatically
    to Smartsheet, and each row shows a simple progress bar derived from
    Status. This view is admin-only by design (see Limitations) — the public
    `/roadmap` stays a read-only quarter board.

## The Smartsheet sheet

A sheet called **"Idea Portal - Ideas"** has already been created for you in
your "Platform Services (Prabu)" workspace:
https://app.smartsheet.com/sheets/95Jq78pWhVghjF2RRrR77hq65GPPgfvJ9pmxgG81

Columns: Idea, Description, Submitter Name, Submitter Email, Votes, Status
(New / Under Review / Planned / In Progress / Shipped / Not Planned),
Release Quarter (Backlog / Q3 2026 / Q4 2026 / Q1 2027 / Q2 2027 / Q3 2027 /
Q4 2027 / Q1 2028), Category (Feature / Improvement / Integration / Bug /
Other), Source (Customer / Internal), Product (General, to start), Release
Notes (free text, shown publicly once an item is Shipped). Each row's
Smartsheet-native "created" timestamp is used as the submission date, so
there's no separate date column to manage.

Status, Release Quarter, Category, and Product are all just Smartsheet
dropdown columns under the hood — the "Manage field options" panel in
`/admin` adds new values to these same dropdowns via the Smartsheet API, so
they show up whether you look in the app or open the sheet directly.

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
- **Excel import size.** Serverless hosts like Vercel cap request body size
  (roughly 4.5MB on Vercel's free tier) — plenty for a spreadsheet of ideas,
  but very large workbooks (many thousands of rows or embedded images) could
  hit that ceiling. The importer reads the first sheet of the workbook only.
- **The release quarter list has a fixed initial window** (through Q1 2028).
  Once you get close to running out, add more via "Manage field options" in
  `/admin` — takes a few seconds, no redeploy needed.
- **The Timeline is admin-only, on purpose.** `/roadmap` is public — letting
  anyone edit dates or status would let any visitor reschedule your roadmap.
  The editable Timeline table only lives behind the `/admin` password.
- **Items without a Start Date sort by their Release Quarter's start
  instead**, so nothing you've already entered disappears from the
  Timeline — set an explicit Start Date whenever you want tighter ordering.
- **Progress % in the Timeline is derived from Status**, not tracked
  separately (New/Planned=0%, In Progress=60%, Shipped=100%, etc.).
- **The Timeline is a table, not a Gantt chart** — after repeated attempts to
  make a drag-and-drop Gantt chart fit any screen without a scrollbar or
  cramped columns, it was replaced with a filterable, sortable table. You
  lose the drag-to-reschedule interaction, but every row is always fully
  visible and readable regardless of how many items or how wide a date
  range you have; dates and status are still editable inline.
