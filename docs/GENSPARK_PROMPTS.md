# Genspark.ai Master Prompts for Full‑Stack Rebuild

The current repository is a static SPA that uses a RESTful Table API. The following prompts are provided to help you rebuild the app as a full‑stack React/Node/Mongo/Socket.io monorepo while preserving functionality and the snapshot‑first goals model. Use these prompts directly in genspark.ai (or similar) to generate the server and client code.

IMPORTANT: These prompts are for a separate full‑stack project. Do NOT paste generated backend code into this static site.

---

## Prompt 1 — Full‑Stack Master Rebuild (React/Node/Mongo/Socket.io)

You are an expert full‑stack engineer. Build a production‑ready monorepo with:
- Frontend: React 18 + Vite (or CRA), TypeScript, Tailwind CSS, Redux Toolkit
- Backend: Node.js 20 + Express, TypeScript, MongoDB (Mongoose), Socket.io
- Testing: Cypress (E2E), Vitest/Jest (unit)
- Tooling: ESLint, Prettier, Husky + lint‑staged, Docker Compose for dev, GitHub Actions CI
- Auth: JWT (httpOnly cookie), bcrypt password hashing
- CORS: enabled for the frontend origin

Primary business requirements:
1) Snapshot‑First Goals Architecture
   - Primary collection: goals_snapshots with compact monthly rows
     - Shape: { id, month: 'YYYY-MM', weeks: number, values: { [metricKey]: { ae:number, am:number } }, userId: null, updated_at: ms }
   - Legacy compatibility collection: goals
     - Shape: { id, role: 'ae'|'am', metric, period: 'week'|'month', target: number, month: 'YYYY-MM', weeks:number, userId:null, updated_by, effective_from, notes, created_at, updated_at }
   - Write path: Admin publishes a single monthly snapshot; a background job fan‑outs legacy rows for compatibility
   - Read path: Consumers read snapshot‑first; fallback to legacy when snapshot missing

2) Activities and Analytics
   - Collection: activities (shape mirrors current static app fields)
   - Realtime updates: Emit activities_updated and goals_updated via Socket.io on create/delete and snapshot publish
   - Aggregation endpoints to power analytics:
     - GET /analytics/summary?period=week|month|7days|all&userId=(optional)
     - GET /analytics/trend?period=week|month&userId=(optional) (returns weekly buckets)
     - GET /leaderboard?period=week|month (role aware)

3) Users and RBAC
   - Collection: users { id, email, password_hash, name, role: 'admin'|'ae'|'am', is_active, avatar_url, last_login }
   - Auth endpoints: POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
   - Middleware: requireAuth, requireRole('admin')
   - Seed: If no users, create admin (bmiller@ascm.org, password: br53mi22) and hash immediately

4) Admin Tools
   - Endpoints (admin‑only):
     - POST /admin/reset/activities → deletes all activities
     - POST /admin/reset/goals → deletes all legacy goals + snapshots, then publishes a zero snapshot for current month
     - POST /admin/reset/master → runs both
   - Return JSON summaries; emit activities_updated and goals_updated events

5) SSE/WS (Socket.io)
   - Namespaces: /events
   - Events: activities_updated { userId? }, goals_updated
   - Server emits on create/delete/publish; client listens and refreshes

6) Frontend SPA
   - Persistent fixed left navigation shell (matches static app design)
   - Routes: Home, Activity Entry (AE/AM), Analytics (consolidated), Leaderboard, Admin Users, Goals Portal (Admin), Admin Tools (Admin)
   - Home shows: welcome, quick actions, weekly KPIs, module tiles, notifications
   - Analytics: merge “analytics-dashboard” and “analytics-react” into a single page with KPIs, donut, trend, heatmap, table; add admin “Advanced” section
   - Goals Portal: virtualized grid for AE/AM weekly values with auto‑computed monthly totals; publish snapshot and display ribbon/toast/JSON result
   - Role gating: Client hides admin routes for non‑admins; server enforces via middleware

7) Data Model and API Contracts
   - Mongo collections and indexes:
     - users: unique index on email
     - activities: compound indexes on userId, date, role; TTL not required
     - goals_snapshots: unique index on { month, userId:null }
     - goals: index on { month, role, metric, period }
   - API responds with JSON only; use error handler middleware; standardized error JSON { status:'error', code, message, details }

8) Migration from static to full‑stack
   - Copy metrics catalog and role keys from static repo
   - Preserve snapshot‑first logic and background fan‑out
   - Replace RESTful Table API calls with the new endpoints
   - Keep BroadcastChannel/localStorage events for cross‑tab; also wire Socket.io push

9) Testing & CI
   - Cypress: E2E covering login, role gating, goals publish, dashboard refresh on events, Admin Master Reset
   - Unit tests for services (goals, activities) and reducers/slices
   - GitHub Actions: lint + test + cypress, block deploy on failure

Deliverables:
- Monorepo structure
  - apps/web (React)
  - apps/server (Express)
  - packages/ui (shared UI if needed)
  - packages/types (shared types)
- Docker Compose for Mongo + server + web (dev)
- Seed scripts for admin user and demo data
- Detailed README with env vars, run scripts, and deployment notes

---

## Prompt 2 — Cleanup, Consolidation, and Accuracy Fixes

You are now tasked with a cleanup pass across the new monorepo. Objectives:
1) Consolidate Analytics
   - Merge legacy and React analytics into one page/module
   - Sections: KPIs (Total Activities vs weekly goal, Conversion, Pipeline, Revenue, Usage Level, Referral Efficiency), Donut (Activity Distribution), Weekly Trend (stacked bars + lines), Heatmap (top users), Data Table (sortable), Advanced (admin‑only: AE/AM weekly/monthly tables, predictive trends, export)
   - Accuracy: Ensure per‑user filtering and role scoping are correct; derive weekly goal from snapshot‑first; fallback to legacy goals; derive month↔week via weeks

2) Standardize Navigation
   - Persistent left navigation; no top‑nav modes; responsive hamburger
   - Admin‑tagged items visible only for admins
   - Content updates in right pane without full reload

3) Snapshot‑First Enforcement
   - Consumers read goals_snapshots first; use goals only as fallback
   - Background fan‑out is non‑blocking and resilient (retry with exponential backoff + jitter)
   - Admin Tools Master Reset publishes zero snapshot and broadcasts updates

4) Realtime Consistency
   - Socket.io pushes for activities_updated and goals_updated; debounce duplicate refreshes
   - BroadcastChannel/localStorage events also supported for offline/local tabs

5) Leaderboard Fixes
   - Use per‑role weights; ensure sorting and tie‑breakers stable; correct recent activity window logic
   - Add tests for podium and top N order stability

6) Reliability & Resilience
   - Client: AbortController timeouts, cache‑busting cb, path normalization, warm‑up HEAD/GET, exponential backoff with jitter, HTML/WAF detection, retry loops
   - Server: Structured error responses, rate limit, CORS config, request logging, health endpoint, readiness/liveness probes

7) Test & Docs Update
   - Update Cypress specs to drive navigation via SPA shell; verify Admin Tools Master Reset; verify snapshot publish triggers analytics refresh via Socket.io
   - README: document snapshot‑first model, endpoints, events, and admin reset

Deliverables:
- PR with refactors and removed redundancy
- Updated tests and docs
- Clear changelog of fixes and verifications

---

Tips:
- Reuse metrics and goal computation utilities across server and client to prevent drift
- Keep zero‑state UX friendly (placeholders, helpful hints)
- Provide robust seed scripts and an .http collection for API testing
