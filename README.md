# CivicAI - backend (Express + MongoDB)
Hackathon prototype. Not affiliated with any government body or Microsoft. No government integration exists.

## Setup
1. Node 18+ and MongoDB (local or Atlas).
2. `cd backend && npm install && cp .env.example .env`, then edit `.env` (JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI).
3. Optional AI: set `AI_API_KEY` and `AI_MODEL`. If empty, `/api/issues/analyze` returns 503 and the client must offer **Demo Analysis Mode** (`demoScenario`: pothole|garbage|streetlight|water).
4. `npm run seed` (demo data, flagged `isDemoData`), then `npm run dev`. Check `GET /api/health`.

## API
POST /api/auth/login | POST /api/issues/analyze (multipart `image` + `description`, or `demoScenario`) | GET /api/issues/nearby?lat&lng&category | POST /api/issues (multipart, header `x-reporter-id`) | GET /api/issues | GET /api/issues/:id | PATCH /api/issues/:id | PATCH /api/issues/:id/status | GET /api/issues/:id/duplicates | PATCH /api/duplicates/:id | POST /api/issues/:id/support | GET /api/map/issues | GET /api/analytics | GET /api/health

Citizens are anonymous: client generates a random id and sends it as `x-reporter-id` (used for My Reports). Admin uses JWT. Status moves one step at a time and every change writes a StatusHistory record.

## Duplicate intelligence
Heuristic only: open issues of the same category within 150 m are "likely related". Image similarity is not computed. Master-issue grouping happens only after an admin confirms (`PATCH /api/duplicates/:id`).

## Quick test
curl localhost:5000/api/health
curl -F demoScenario=pothole localhost:5000/api/issues/analyze

## Known limitations
No React frontend in this package; `analysisMode` is client-supplied; no rate limiting; uploads on local disk; not tested against a live MongoDB or AI key in the build sandbox.
