# PIP — Procurement Intelligence Platform

A dashboard for managing purchase orders and supplier relationships from Infor LN ERP exports (MC16, PSM Dashboard, Backlog, MRP Orders, SC Orders, Partial Deliveries), plus a supplier directory, email drafting, shipment tracking, a to-do list, and an AI procurement assistant.

Built with Next.js (App Router) + TypeScript + Tailwind CSS. All ERP data lives in the browser's `localStorage` — there is no database and no authentication in this version.

The original single-file HTML prototype this app was migrated from lives in [`/legacy`](./legacy) for reference; it is no longer maintained.

## Local development

Requirements: Node 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/dashboard`.

To use the AI assistant locally, create `.env.local` in the project root:

```bash
GEMINI_API_KEY=your-gemini-api-key
```

Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Without this variable set, every other feature works normally — only the AI chat panel will show a clear "not configured" error when you try to send a message.

Useful scripts:

```bash
npm run dev      # start the dev server
npm run build    # production build (also type-checks)
npm run lint     # ESLint
```

## Data & import

Drop an Excel (`.xlsx`) or CSV export from Infor LN onto any module's upload zone. The file type is detected automatically, and columns are matched to fields **by header name** (fuzzy, case/accent/wording tolerant) rather than by position — colleagues exporting the same report with reordered or differently-worded columns don't break the import.

The first time a given file layout is seen, you'll get a mapping-preview screen to confirm or correct the detected columns; your correction is remembered per file type in `localStorage`, so subsequent imports of the same layout import instantly. Rows that fail validation (a required field missing or unparseable) are shown to you instead of being silently dropped.

Comments, shipment tracking, and the Backlog "solved" toggle all key off stable per-line identifiers, so they survive re-importing the same order/schedule/article across days even as ERP fields (dates, statuses) change.

## Deploying to Vercel

1. Push this repository to GitHub (or your Git provider of choice) and import it in [Vercel](https://vercel.com/new) — no build configuration is needed, Vercel auto-detects Next.js.
2. In the Vercel project's **Settings → Environment Variables**, add:
   - `GEMINI_API_KEY` — your Gemini API key (required for the AI assistant; the rest of the app works without it)
   - `GEMINI_MODEL` — optional, defaults to `gemini-2.5-flash` if unset
3. Deploy. The `/api/chat` route runs on Vercel's Edge Runtime; everything else is a static/client-rendered page, so there's nothing else to configure.

Since all app data lives in each user's browser `localStorage`, there is nothing to migrate or seed server-side — a fresh deploy starts with an empty dashboard until someone imports a file.

## Project structure

```
app/            Routes (one folder per module) + the /api/chat serverless route
components/     UI components, grouped by area (layout, tables, dashboard, email, ai, ...)
lib/            Domain logic: column-mapping engine, email generation, AI context building,
                localStorage-backed state (lib/state), storage helpers (lib/storage)
hooks/          Small reusable React hooks
types/          Shared TypeScript types
legacy/         The original single-file HTML prototype (reference only)
```
