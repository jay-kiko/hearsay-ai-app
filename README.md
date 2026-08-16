# hearsay.ai — frontend

See what AI models actually say about a brand. Point it at a brand name, and it simulates a set of realistic buyer personas asking AI (Claude) questions in that category, then reports back whether/how often the brand gets mentioned, with what sentiment, and how it stacks up against competitors.

React + TypeScript + Vite SPA. No router — a single `screen` field in app state drives which view renders.

## Prerequisites

This is the frontend only. It talks to a separate FastAPI backend ([`hearsay-ai-api`](../hearsay-ai-api)) that owns the Anthropic API key, admin auth, and the access-code database — that backend must be running for anything beyond the marketing homepage to work.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your running backend
npm run dev            # http://localhost:5175
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Vite dev server (port 5175) |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

## How access works

There are no user accounts. A single shared access code (multi-use, minted by an admin) gates the whole app — entered once, persisted in `sessionStorage` for the tab so a page reload doesn't force re-entry. Admin tooling (mint/list/revoke codes) lives behind a separate `?admin` query param and its own secret, entirely independent of the visitor gate.

## The flow

1. **Home** — describe a brand/product.
2. **Detect** (`/api/detect`) — Claude identifies the brand, industry, competitors (with real-world aliases for mention-matching), buyer context, and a brand summary.
3. **Wizard** — confirm/edit those details, optionally narrow to a more specific product category (`/api/categories`), review/edit generated buyer personas and their prompts.
4. **Analysis** (`/api/analysis`, streamed over SSE) — each persona's prompt(s) get sent to Claude independently; responses are scored for brand mentions, sentiment, and rank.
5. **Results** — visibility score, share of voice vs. competitors, sentiment breakdown, full prompt/response transcripts per persona, sources cited — exportable as PDF or CSV.

## Project structure

```
src/
  App.tsx          — top-level state machine, all API orchestration
  api.ts           — typed fetch client for the backend
  types.ts         — shared wire/app types
  data.ts          — static demo/seed data (personas, AI model list)
  csv.ts           — CSV export
  components/      — one file per screen/major UI piece
```

## Notes

- Every AI generation call (`/api/detect`, `/api/categories`, `/api/generate-personas`, `/api/prompts`) shares one pre-spend rate-limit budget per access code on the backend — see `ApiError` handling in `App.tsx` for how a code going invalid/exhausted mid-session gets handled (bounced to the gate with a toast, not a silent failure).
- `brandSummary` deliberately never reaches the call that measures whether Claude mentions the brand organically — that call has to stay blind to brand identity to measure real visibility, not a rehearsed answer.
