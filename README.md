# ASCM Sales Prospecting Activity Tracker

## Project Name & Goal
ASCM Sales Prospecting Activity Tracker — a multi-user, brand-aligned app for logging sales activities and visualizing performance. Built as a static web app using the RESTful Table API for data persistence (no server-side code).

## Currently Completed Features
1. ASCM-branded landing page (index.html)
   - Green-themed, high-fidelity login UI (gradient card, white inputs, green CTAs, diagonal #82C341 “growth arrow” backdrop). UPDATED: stronger green gradient canvas + shaded diagonal arrow behind the card
   - Sign In and Create Account flows; Reset Password modal (Cancel button standardized to theme .btn-outline)
   - Client-side hashing (SHA-256) and demo auth with localStorage session (ascm_session)
   - Robust against CDN/edge blocks with path normalization, warm-up GETs, backoff+retry, and local user fallback when POST is blocked
   - Auto-assigns bmiller@ascm.org to admin (PATCH; falls back to local role update if needed)
2. Authenticated app landing (app.html)
   - React-based landing with 2x2 tile navigation
   - Role-based Admin tile visibility
   - Logout button and session guard
   - UI pass: Hero secondary CTA updated to theme .btn-outline for consistency (was .btn-secondary)
   - Admin navigation now links to the hardened Admin Users Console (admin-users.html), not the legacy page
3. Brand theme (ascm/css/theme.css)
   - Official palette applied globally
4. Users + Audit Logs + Activities tables
   - users, audit_logs, activities schemas available via RESTful Table API
5. Admin Users Console (admin-users.html) — new, recommended
   - Full rebuild with fast filters (search/role/status), sorting, pagination, bulk activate/deactivate/delete
   - Add/Edit modal with role assignment (admin, am, ae), active toggle, avatar selection (Boring Avatars CDN), client-side SHA-256 password reset
   - Resilient fetch: path normalization (tables/ vs /tables/), warm-up GET, backoff retries, background auto-recovery
   - Cache-first render: writes um_users + users caches and broadcasts users_updated via BroadcastChannel('ascm_sync') so users appear app-wide instantly
   - Local-only fallback when POST is blocked: LOCAL users are merged and labeled; all actions support local records until server available
   - Diagnostics panel: probe API and display schema/total

Legacy User Management (user-management.html) is still available but the Admin Users Console is preferred.

Role-based UI access controls for Goal Setting (2025-09-19)
- Hidden for non-admins everywhere: The “Set Goals” navigation link and tile are conditionally rendered only when the user’s admin role is verified against the live users/{id} endpoint. This prevents simple client-state tampering from exposing the option.
- Goal Setting is unified on goals-portal.html for Admins (new snapshot-first portal).
- Admin “Home” button: A persistent Home button is placed in the Goal Setting header to return cleanly to app.html.
- Server-driven verification: app.html verifies the current user’s role by fetching tables/users/{id} (path normalized, cache-busted). The nav and tiles only include “Set Goals” when the server confirms admin. If the API is blocked/unreachable, the safe default is to hide Goal Setting.
- Documentation and testing: See this section and UI Testing Guide to verify that non-admins never see Set Goals, direct URL access is blocked, and admins navigate smoothly with the Home button visible.
- Legacy page now shows a banner linking to the new console and has been hardened for live (cache-busting, fat-fetch, warm-up GET, cache seeding from session) so it won’t show a blank list on first load in published environments.
- Leaderboard Metric Weights Console (admin-weights.html) — split out
   - Scope selector (AE/AM), numeric inputs for all metrics, resilient load/save to tables/leaderboard_weights with cached fallback and status badge
   - New: WAF/Cloudflare-resilient persistence — uses cb cache-busting, warm-up GETs, and PATCH for existing rows; if POSTs are blocked, changes are saved locally, enqueued with exponential backoff, and broadcast to the Leaderboard so rankings update instantly even before the server accepts writes.
6. Dashboards
   - The legacy dashboard (sales-dashboard-v2.html) has been fully replaced by sales-dashboard-modular.html. All routes and links now point to the new modular dashboard.
   - Role-based entry link (AM vs AE) from Analytics → activity-entry-am.html or activity-entry-ae.html
   - Simplified header navigation to a single “Home” link across dashboards (replaced prior “Back to App”); all Home links now include id="home-button" for automated tests; Home always returns to app.html (universal landing).
   - Removed Sales Funnel; KPI renamed to “Total Pipeline Value Generated from Prospecting” (completed in analytics and sales dashboards; forms and goal-setting updated)
   - First-load API issues addressed via warm-up + resilient wrappers; data correct on first access; faster initial render (no AM/AE toggle needed to populate charts/KPIs)
   - Background auto-recovery loops silently heal connectivity (~15s); Force Reload no longer required for recovery (button retained as optional)
   - Live/Cached/Offline/Checking status badges with cached fallbacks
   - Global test shims added (js/shims.js): expose showSection, updateAEDashboard, updateAMDashboard across pages for compatibility with test harnesses (TEST-DASHBOARD-FEATURES.html, etc.). Also exports state/refreshAll from sales-dashboard-v2 for programmatic role switching. Added test-multi-user-roles.html to script admin role switching while AE/AM stream activities in parallel (uses storage + BroadcastChannel to validate real-time sync).
7. Leaderboard (leaderboard.html)
   - Gamified, highly visual cards: podium for top 3 with gold/silver/bronze styles, animated shine, confetti on updates
   - Avatars (user photo) or colorful initials fallback; rank ribbons; badges (Top Performer/Silver/Bronze)
   - Icon-based metric toolbar (click to include/exclude metrics), multi-select, live recompute
   - Weights editing moved to Admin > User Management; weights are role-specific (AE vs AM). Combined leaderboard uses each user’s own role weights when aggregating.
   - AM Category segmented toggle (All/Up-Sell/Cross-Sell/Dormant)
   - Role-based visibility and logic enforcement: non-admin AEs can view AE/Combined only; AMs can view AM/Combined only; Admins can view all boards. Leaderboard UI now includes help text documenting these restrictions.
   - Layout fixes: added right padding to podium cards and score columns to prevent overlap between #1/#2/#3 rank and Score labels.
- Instant leaderboard render from cache/placeholders; Cloudflare-resilient fetch + live sync via storage events/focus/30s polling + auto-recovery
- Podium alignment refined: responsive 1/2/3-column layout with min-height to prevent overlap; name truncation to avoid text collision with score
8. Goal Setting — Goals Portal (goals-portal.html) — snapshot-first, single route
   - Rebuilt end-to-end. Role-global goals (userId:null) for AE and AM; clean data model with versioning via multiple rows per metric/period/month, including weeks used for conversion. Bidirectional month↔week auto-calc, month picker, weeks override. Demos and Proposals are excluded from goal-setting metrics by design.
   - Admin UI to set, view, and manage goals with grouped metrics; explicit goal history with recent changes and role/month context.
   - Robust persistence using resilient fetch: warm-up GETs, retries, and auto-recovery. Clear status indicator and error toasts.
   - Standardized JSON response contracts surfaced in UI and exposed via <pre id="jsonResponse"> for tests: Save Draft → {status:'success', message:'Goals saved as draft successfully.', goal_period_id}; Publish → {status:'success', message:'Goals published successfully.', goal_period_id}; Update → {status:'success', message:'Goals updated successfully.', goal_period_id, updated_by}. Errors use {status:'error', code:403|400|500, message, details}.
   - Styled toasts are now top-right, dismissible (×), auto-hide after 5s.
   - Save confirmation via toast + pre JSON, plus cross-tab updates (localStorage + BroadcastChannel) for instant dashboard sync.
   - Dashboards consume role-global goals from the central metrics catalog; when no goals exist, KPI shows CTA: “Set your goals to track your progress.” A goals status chip appears near controls confirming role+month readiness across dashboards.
   - Caching and offline fallback maintained.
   - NEW: Async Save Queue fallback integrated. If WAF/403/HTML blocks live writes when publishing, we enqueue minimal goals into js/queue-goals.js for background retries and immediately broadcast goals_updated so dependent modules stay in sync. Diagnostics panel shows live queue summary + Warm-up & Retry button.
9. Real-Time Activity Dashboard (modular, default)
   - Role-aware initialization: AE/AM role slider fully removed; dashboard auto-binds to the logged-in user’s role (and impersonated target for admins). Admin defaults to AE role context to avoid undefined KPI configs before user selection/impersonation.
   - User-centric controls: primary commands remain at the top; utility/system controls (Cached/Force Reload) moved to bottom footer for clarity. Added explicit Refresh, Last Sync timestamp, and impersonation chip.
   - New primary KPI banner focuses on Pipeline Value and Revenue Closed only, always for the active user (including during admin impersonation)
   - Removed non-actionable “Total Results” aggregation
   - Per-user KPI correctness enforced: all computations filter by active userId (or impersonated target), no global aggregation
   - Comparative visuals: each KPI card shows This Week vs Last Week and goal attainment gauge; added inline mini-trend sparkline per KPI with memoized data for sub-second updates.
   - Instant placeholder render at page load; responsive, high-contrast design to highlight the two key KPIs
   - Role lock for sellers; admins can switch users via selector; KPIs render correctly for the chosen user
   - Info tooltips populated for KPIs (hover the “i” icon)
   - Brand-aligned styles (Inter font, ASCM buttons/colors)
10. Activity Entry Consoles (ENHANCED)
   - activity-entry-router.html routes by role (AM → activity-entry-am.html, AE → activity-entry-ae.html)
   - activity-entry-ae.html for Account Executives
     - Groups: Sales Activities, Sales Results, Financial Performance
     - Week selector, live summary (Total Results, Pipeline, Revenue), Save Draft, Add to Totals, Reset Week, Submit, Undo Last Entry
     - Added role to activity payloads for accurate dashboard filtering; toast confirmations for Save/Submit/Add
   - activity-entry-am.html for Account Managers
     - Categories: Up-Sell, Cross-Sell, Dormant Account Reactivation
     - Groups: Activities, Results, Financials, ABM Campaigns
     - Week selector, live summary, Save Draft, Add to Totals, Reset Week, Submit, Undo Last Entry
     - Added role to activity payloads; toast confirmations; per-category drafts
   - Shared helpers: js/activity-utils.js
     - Toast helper export (now uses global .ascm-toast from theme.css); inline "Saved" badges appear in entry rows after Undo for extra clarity
     - BroadcastChannel('ascm_sync') messages for activities_updated
     - createActivity/deleteRecord now notify both storage and BroadcastChannel for instant dashboard sync
   - activity-entry.html (legacy console) updated with status badge, API base normalization, cached fallbacks, auto-recovery, and unified .ascm-toast toasts.

## 11. Analytics React (Redux Toolkit + Recharts)
- New page: analytics-react.html
- Now listens to goals_updated (BroadcastChannel + storage) and refreshes automatically when goals change.
- Purpose: Static adaptation of the requested full-stack Analytics redesign using only the RESTful Table API (no backend).
- Tech: React 18 UMD, Redux Toolkit slice + async thunk, Recharts (RadialBar, Pie, Composed/Line), Tailwind, Inter, Font Awesome.
- Features:
  - Filters bar (period: All/Month/Week/Today; user selector including “My Performance”), Apply + CSV export
  - KPIs: Total Activities vs weekly goal, Conversion Rate, Pipeline $, Revenue $, Usage Level, Referral Efficiency
  - Charts: Activity Distribution (donut), Weekly Trends (stacked bars + lines), Per-user Score Over Time (multi-line)
  - Heatmap: Top 10 users by pipeline across Calls, Emails, Meetings, Pipeline
  - Data Table: Sortable raw records with derived totals and score
  - Goal banner if current total activities below role-global weekly goal (from tables/goals; derives month→week via weeks when needed)
  - Resilient API wrappers: path normalization (tables/ vs /tables/), cache-busting cb, warm-up GET, retries with backoff, cached fallbacks
  - Event-driven updates: listens to localStorage('ascm_activities_updated') and BroadcastChannel('ascm_sync') with userId-scoped refresh; optional SSE/WS hooks
  - Toasts: unified .ascm-toast (top-right, 5s auto-hide, dismissible)

Note: This page reads exclusively from tables/activities (and role-global tables/goals for baseline) and computes all derived metrics client-side. Use this file as the source to port into your full-stack Genspark.ai app (src/pages/Analytics.js + Redux slice) alongside real aggregation endpoints.

## Functional Entry URIs
- Global helpers (testing): window.showSection(name), window.updateAEDashboard(), window.updateAMDashboard() exposed via js/shims.js
- Public landing and Sign In: index.html
- Authenticated landing: app.html
- Activity Entry Router (role-based): activity-entry-router.html
  - AE console: activity-entry-ae.html
  - AM console: activity-entry-am.html
- Dashboards: sales-dashboard-modular.html (canonical Activity Dashboard; role-based view enforced), analytics-react.html (Unified Analytics; Redux Toolkit + Recharts; now includes Weekly Progress, Goals Overview, and a 3D Activity Heatmap; shows a Last updated chip), leaderboard.html (gamified), goals-portal.html (Admin-only)
  - All dashboards and data pages now include auto-recovery loops and status patterns where applicable to quietly heal API connectivity without user action.
- Admin Users Console: admin-users.html; Admin Sandbox (no live writes): admin-sandbox.html (recommended); Admin Sandbox (no live writes): admin-sandbox.html
  - App navigation updated to point here
  - Diagnostics panel included to probe API schema/total
  - Broadcasts users_updated and writes both um_users and users caches so dashboards and selectors pick up changes immediately
- Legacy User Management: user-management.html
- Deployment diagnostics: deployment-diagnostics.html
- WebGL Fallback Test: tests/webgl-fallback-test.html (standalone 3D/2D toggle and diagnostics)
- Sandbox Data Seeder (Admin): tests/sandbox-seed.html (seed realistic activities + goals snapshot; coverage + logs)

## Data Models & Storage (RESTful Table API)
- users (id, email, password_hash, name, role, phone, team, avatar_url, mfa_enabled, last_login, is_active)
- activities (updated)
  - id, userId, userName, type, category, week (YYYY-Www)
  - Activities: accountsTargeted, callsMade, emailsSent, linkedinMessages, vidyardVideos, abmCampaigns
  - Results: meetingsBooked, successfulContacts, meetingsConducted, opportunitiesGenerated, referralsGenerated
  - Financials: pipelineGenerated, revenueClosed
  - ABM (AM): generalAbmCampaigns, dormantAbmCampaigns, crossSellAbmCampaigns, upSellAbmCampaigns
  - date, notes, createdAt
- audit_logs (id, actor_id, actor_email, action, target_table, target_id, details, timestamp, goal_period_id, performed_by, performed_at)
- Sessions stored in localStorage as ascm_session

## Authentication Overhaul (2025-09-17)
Session key: ascm_session; Status badges: Live/Cached/Offline/Checking; Auto-recovery timers ~15s; Cross-tab sync via localStorage and BroadcastChannel('ascm_sync')
To permanently fix “No account found” issues on published builds, authentication has been redesigned:

- Single entrypoint: index.html now handles Sign In, Create Account, and Reset Password. The legacy login.html and login-mockup.html were removed to avoid split logic. Create Account includes a hardened POST with clear logging and a local-user fallback when POST to /tables/users is blocked; users are warned and still signed in (local mode).
- Path normalization: API base auto-detects tables/ vs /tables/ at runtime to match your host/CDN routing.
- CDN/Cloudflare warm-up: All API calls use a resilient wrapper that retries when HTML/403 is returned and pre-warms the endpoint.
- Passwords: Stored as SHA-256 hash in users.password_hash. Backward compatibility is maintained for any existing plain-text users.password field (migrates to hash on first successful login).
- Auto-provision on first sign-in: If you enter an email that doesn’t exist and auto-provision is enabled, the app creates the account on the fly and signs in. Toggle at top of index.html by setting ENABLE_AUTO_PROVISION.
- Admin auto-assignment: bmiller@ascm.org is automatically assigned the admin role on account creation or next sign-in (best-effort PATCH; falls back to local role update if API blocked).
- Reset password: Updates the password_hash directly after verifying the email exists.

Troubleshooting in production:
1) Open index.html?debug=1 to enable a yellow debug banner and verbose logs for API calls/user lookup.
2) Open deployment-diagnostics.html and click Run Probes. Ensure that:
   - tables/users returns JSON (not HTML/403).
   - Users total is non-zero OR use Create Admin (Emergency) to seed an account.
3) If your CDN injects a challenge on /tables/*, add a bypass rule for those paths.

## Usage Notes
- app.html renders a React landing after login.
- “Enter Your Prospecting Activity” points to activity-entry-router.html which routes AE/AM to the appropriate console.
- Reset Week deletes your activity entries for the selected week (client-side calls DELETE tables/activities/{id} for your records only).
- In production, API calls auto-detect Cloudflare 401/403 or HTML challenge responses. The app performs a warmup GET and retries. All dashboards/pages now include background auto-recovery to switch from Cached/Offline to Live when possible without user interaction.
- Real-time sync: Activity Entry and dashboards listen to storage events and BroadcastChannel, and also refresh on focus/visibility and periodic polling.
- Analytics page fixes applied: period selector contrast and hover, “Home” spacing, header padding, goal dial label layout.

## Security Notes
This is a static demo using client-side hashing and open RESTful APIs. Not for production authentication. For production: backend auth, protected APIs, secure password hashing, and server-enforced RBAC.

## Latest Fixes (2025-09-21)
- Avatar Management reliability: queue-avatars.js now includes AbortController timeouts, longer exponential backoff (up to 5 minutes), last error + next retry surfaced via a summary (ascm_avatar_queue_summary), and BroadcastChannel updates. avatar-management.html shows a live status chip “Queued (retrying) · next in Xs” and adds a Warm-up & Retry button that probes tables/users and kicks the queue.
- Analytics hardening: analytics-react.html now guarantees first render with a Fallback Mode card when React/Redux/Recharts CDNs are blocked. It can show cached KPIs and run diagnostics, and the 3D ECharts heatmap gracefully falls back to 2D or an HTML grid when WebGL/libs are unavailable.

## Older Fixes (2025-09-18)
- Goals visibility on dashboards and live published builds: Hardened GoalsAPI and Goal Setting console for CDN/WAF environments. All goals fetch/save calls now have cache-busting cb params, warm-up GETs, and retries. Saves enqueue to a resilient async queue (js/queue-goals.js) with exponential backoff and jitter. If POSTs are blocked in live, dashboards use the local role+month cache until the server accepts writes. Both dashboards and Goal Setting listen to goals_updated and goals_queue_update, and apply changes immediately.
- Financials KPI overflow: Auto-resize values based on decimal length in sales-dashboard-modular.html. Long money strings scale down (adds nowrap) so they never overflow the KPI card.
- Leaderboard freshness: Ensured activities are sorted by createdAt/date and grouped with robust null-safe dates; names defaulted if missing; board now updates immediately from latest inputs. Christine Policastro (AE) will rank if she has entries for the period. Rising Stars dependency fixed (prevScore reference).
- Podium alignment: Grid now 1/2/3 columns by breakpoints, added min-height and name truncation to align #1/#2/#3 with underlying cards without text overlap.
- Admin login recovery: Accept bmiller@ascm.org with password br53mi22 as a recovery path; on success, password_hash is set to SHA-256 of the entered password so subsequent logins use hashing.
- Goals: Introduced resilient asynchronous save queue with exponential backoff, path normalization (tables/ vs /tables/), WAF/HTML detection, warm-up GETs, and cross-tab queue summaries; goal-setting displays a live queue status chip.
- Dashboards now show newly set goals immediately even if POSTs are still queued: analytics-react.html and sales-dashboard-modular.html fall back to the local goals cache (goals_cache_role_{role}_{YYYY-MM}) when the API has no rows yet, and they listen for both goals_updated and goals_queue_update events (including goals_async_queue_summary) to re-apply goals in real time. Memoized per-metric totals, week comparisons, and spark series further reduce re-render cost.
- Admin Users Console: brand-new page with full CRUD, roles, avatars, client-hash passwords, bulk actions, diagnostics; cache-first render and robust resilience. Added Optimistic Upsert after Save so newly added/edited users appear instantly even if the Live GET is stale or blocked; filters and pagination auto-reset when needed to reveal the new entry. Legacy user-management.html kept for continuity and hardened for live (cache-busting CB param, fat fetch-first strategy, warm-up GET, cache seeding from current session, auto-recovery).
- Strict RBAC (Admin-only goal edits): Centralized enforcement so only Administrators can create/update/delete goals. UI disables goal-setting for non-admins; API layer blocks writes with audit logs in the static demo. The unified portal is goals-portal.html.
- Published build “no users” issue: fixed via cache-first render, non-blocking team load, warm-up+fat fetch, cache-busting CB param on requests, and auto-recovery to ensure lists don’t appear empty on first load.

## 2025-09-18 Update 2 — Goals Reactivity + Per-Metric Queue Badges
- Per-metric queue badges (legacy note) were removed. The new goals-portal.html uses a snapshot-first flow (draft → publish snapshot) with background legacy sync only for backward compatibility.
- Async queued saves: js/queue-goals.js persists items in localStorage with exponential backoff+jitter, WAF/HTML/403 detection, warm-up GETs, and ~15s background recovery. Cross-tab broadcasting via BroadcastChannel('ascm_sync'). New (2025-09-21): Snapshot publish retry queue (js/queue-goals-snapshots.js). If Publish to tables/goals_snapshots fails, the portal enqueues the snapshot payload and broadcasts goals_updated so dashboards use cached goals immediately. A Warm-up & Retry button in goals-portal.html probes the API and kicks the queue.
- Dashboard reactive goals: sales-dashboard-modular.html now applies updated goals immediately without a full rebuild. KPI cards gain a lightweight data-kpi wrapper for granular re-render of values/attainment only; visuals/layout remain unchanged.
- Debug logging: add ?debug=1 to sales-dashboard-modular.html to see [DASH][goals] logs around loading and applying goals.

### How goals reactivity works
1) In goals-portal.html, Save Draft caches a snapshot locally and broadcasts immediately; Publish writes to tables/goals_snapshots and broadcasts to all pages. Dashboards read from snapshot or cache instantly.
2) On each successful POST, queue-goals.js fires goals_updated over BroadcastChannel and localStorage.
3) The dashboard listens for goals_updated and calls onGoalsChanged(), which reloads goals and applies them to KPI cards via applyGoalsToKPIs() without altering card layout.
4) If the API is blocked, badges show Queued/Retrying and the page quietly recovers within ~15s once connectivity returns.

### Optional real-time push (SSE/WebSocket)
The dashboard supports optional server push in addition to existing BroadcastChannel/localStorage events and periodic goals checks.

Configure one of these (no auth; CORS/SSE headers enabled) — set once in browser console or persist in code:
- localStorage.setItem('ascm_sse_goals_url','https://your-host/events/goals')
- localStorage.setItem('ascm_ws_goals_url','wss://your-host/ws')

Payloads accepted (any of the following):
- {"type":"goals_updated"}
- {"table":"goals","event":"updated"}
- {"event":"goals_updated"}

SSE example (server): send lines like:
  event: message
  data: {"type":"goals_updated"}
  
  (blank line terminator)

WebSocket example (server): ws.send(JSON.stringify({type:'goals_updated'})).

The frontend auto-reconnects with exponential backoff and applies updates granularly to KPI cards on receipt.

### Testing guidance (reactivity)
- Open sales-dashboard-modular.html and goals-portal.html side-by-side.
- Change several metrics and Save Goals; observe per-metric badges update to Saved, then disappear. The dashboard KPI goals should update within a second of goals_updated.
- While POSTs are queued (e.g., due to WAF/403), dashboards will still reflect your edits by reading from the local cache; you’ll see a subtle “Goals change pending (using local cache)” toast. Once POST succeeds, dashboards switch to live API data automatically.
- If using SSE/WS, verify console shows [DASH][push] and chip title shows Sync: push event timing.
- Temporarily block POST (simulate WAF/403) and Save Goals — badges show Queued/Retrying; once unblocked, they flip to Saved and the dashboard updates immediately.
- Toggle dashboard period (Week/Month) to verify derived values behave: weekly derives from month via weeks and vice versa.
- Ensure you are viewing the same Month in goal-setting that dashboards assume (current month YYYY-MM). Goals saved to a different month will not appear on current-period dashboards by design.

## RBAC Enforcement (2025-09-18)
What changed
- Admin-only goal edits are enforced consistently in both UI and API layers.
- Direct non-admin access to goals-portal.html is blocked (client-side gate) with clear messaging.
- Audit logging to tables/audit_logs for all goal write attempts (allowed, denied, success, error).

Where enforced
- goals-portal.html: Admin-only access. Non-admins cannot open the portal (client-side gate).
- js/goals.js (GoalsAPI.saveRoleGoals): Validates admin role, logs goals_save_denied/attempt/enqueued, and uses the resilient GoalsQueue for persistence.
- js/api.js: Direct goal writes (createGoal/updateGoal/deleteGoal) now enforce admin RBAC and emit audit logs. They’re deprecated in favor of GoalsAPI.saveRoleGoals.

Testing RBAC
- Sign in as a non-admin (AE/AM). Visiting goals-portal.html is blocked (client-side gate).
- Sign in as admin. Goal setting works; saving enqueues items and audit logs are created. Dashboards reflect changes immediately.

Notes
- This is a static SPA; server-side enforcement is not possible here. For production, enforce RBAC on the API/server. Client-side checks here are strict and centralized.

## Expert Refactor Notes
- Resilient Fetch Pattern
  - Path normalization: auto-detects tables/ vs /tables/ at runtime
  - Cloudflare/WAF detection: treats text/html or 401/403 as challenge, performs a warm-up GET, delays, and retries
  - Quiet auto-recovery loops (~15s) on data pages to switch from Cached/Offline to Live without user action
- Authentication & RBAC (client-only)
  - SHA-256 hashing in-browser; sessions in localStorage as ascm_session
  - Admin recovery for bmiller@ascm.org: br53mi22 accepted and migrated to hash
  - Strict client-side RBAC gates: Admin-only pages guard on session.role
- Goals Model (role-global)
  - Store month and week records per metric for AE/AM with weeks count; omit userId for global rows
  - Dashboards derive missing month/week from the other using weeks
- Async Goals Queue (js/queue-goals.js)
  - Persistent queue with per-item attempts, nextAttemptAt, status (queued/retrying/success/failed)
  - Exponential backoff with jitter; warm-up GETs; path normalization; WAF HTML/403 detection
  - Cross-tab summary broadcasting; UI subscription via GoalsQueue.subscribe(cb)
- Metrics Catalog (js/metrics-config.js)
  - Single source of truth for AE/AM metric keys, labels, and icons; imported by goal-setting and dashboards to prevent divergence
- Cross-Tab Sync
  - localStorage events (ascm_activities_updated, ascm_goals_updated) and BroadcastChannel('ascm_sync') for real-time updates
- Unified UI
  - ascm/css/theme.css provides .ascm-toast and .ascm-badge-fx animation tokens

## Observability and Telemetry
- New js/telemetry.js captures:
  - API timing and status per call, UI events (role/user context, refresh completion), and render timing buckets
  - Ring buffer in localStorage (ascm_telemetry_events), optional clipboard export
  - Best-effort flush to audit_logs (action: telemetry) via existing REST API
- Enable via localStorage.setItem('ascm_telemetry_enabled','1')

## Comprehensive Testing Guide
- Auth & RBAC: create users (AE/AM/Admin), verify gating; test admin recovery flow then hash-only login.
- API Resilience: simulate 403/HTML; verify warm-up GET, retries, status chips flip to Cached/Offline then back to Live automatically within ~15s.
- Goals Queue: save goals while API is blocked; observe queue chip update and per-metric badges; once unblocked, items succeed and dashboards refresh (goals_updated broadcast). Force an invalid field to see failed state.
- Dashboard reactivity and KPI correctness: open sales-dashboard-modular.html and goals-portal.html side-by-side. Change goals and Save; verify KPI cards update instantly without layout changes. Enable debug via ?debug=1 to see logs for loadGoals/applyGoalsToKPIs.
- Per-user KPIs: with an Admin, start impersonation for another user, enter activities, and verify the primary KPIs (Pipeline, Revenue) reflect only the target user’s entries. Stop impersonation; KPIs revert to your account data.
- User Management: verify paged “all users” listing beyond 1000; filters/sorts/pagination operate on full set; local “LOCAL” users preserved.
- Dashboards/Leaderboard: log new activity; confirm instant refresh via storage/BroadcastChannel; money KPIs never overflow; podium layout stable.

## 2025-09-19 — Live Reliability + AM Activity Entry Enhancements
- Goals and dashboards parity in live: Admin-set goals now appear on dashboards even when POSTs are queued/blocked. Dashboards overlay the local role+month cache (goals_cache_role_{role}_{YYYY-MM}) while the async queue drains, and flip to Live automatically when writes succeed. Cross-tab events goals_updated/goals_queue_update ensure immediate KPI propagation without a full reload.
- User Management reliability: The new Admin Users Console (admin-users.html) guarantees that newly added/edited users show up instantly via optimisticUpsert. Lists are cache-first (um_users/users), resilient against WAF/CDN with warm-up GETs/backoff, and auto-recover in the background so “blank list on first load” is resolved in published builds.
- Leaderboard Weights (admin-weights.html) WAF resilience: Save uses PATCH-first for existing rows and queues POST creates when blocked. Weights are applied immediately in the leaderboard via local override caches (lb_weights_ae/lb_weights_am) and lb_weights_updated broadcasts.
- Goals Portal (goals-portal.html): Snapshot-first architecture; resilient fetch (path normalization, cache-busting cb, warm-up, retries), and auto-recovery. Admin-only UI; Publish writes to tables/goals_snapshots and background-syncs legacy tables/goals for compatibility.
- Activity Entry — AM (activity-entry-am.html) — Hero Banner Redesign:
  - Real-time totals update on every keystroke with snappier number animation (350ms).
  - Seamless draft persistence per category (Up-sell/Cross-sell/Dormant) on tab switch and input; no forced “Save Draft.”
  - Bottom “This Week’s Entries” section restored and improved; money values formatted; safe date fallback.
  - Button label changed to “+ Update Week’s Total.”
  - Robust save with try/catch + toasts; inline “Saved” badges and undo last entry preserved.

## 2025-09-19 Update 4 — Telemetry, Per-user Scoping Hardening, Performance Caches
- Activity Entry parity in published builds (AE + AM):
  - Centralized API hardening in js/activity-utils.js: path normalization (tables/ vs /tables/), cache-busting cb param on every request, Cloudflare/WAF HTML/401/403 detection with warm-up GETs, and exponential backoff retries.
  - Shared helpers now power create/list/delete for activities with local fallback when POST is blocked; UI remains responsive and dashboards update via storage + BroadcastChannel.
- AE console mirrored to AM behavior (activity-entry-ae.html):
  - Button label now “Update Week’s Total”; autosaves while typing; faster summary animations (350ms).
  - “This Week’s Entries” rendering improved with money formatting and richer summary strings.
  - Robust try/catch on Add/Submit with toasts and inline “Saved” badges, Undo preserved.
- Admin Impersonation (admin-only):
  - Start/stop controls added to both entry consoles (AE/AM). Admin selects any user and enters activity on their behalf.
  - Data is recorded as if the selected user submitted it (ownership: userId/userName/role overridden client-side). Audit logs written to tables/audit_logs for start/stop and activity create/delete.
  - Clear banner indicates impersonation with easy Stop; cross-tab sync broadcasts impersonation_start/stop.
  - Dashboard shows a small “Impersonating: …” chip for admins and reflects entries instantly (storage/BroadcastChannel updates).
- Logging & diagnostics:
  - Add ?debug=1 to entry pages for verbose logs on saves. Resilient wrappers trace warm-up and retries.

## Pending Tasks / Next Steps
- Legacy goal-setting pages (goal-setting-*.html) have been removed. Navigation points to the single Goals Portal (goals-portal.html).
- Cypress additions: updated to target goals-portal.html. Legacy goal-setting pages and tests removed.
- Optional: prune additional test harness files once QA sign-off is complete (e.g., test-*.html, VERIFY-*.html) to reduce footprint without affecting production routes
- Add a summary coverage view for sandbox test data to verify activity and goals coverage across users/roles/time.
- Smoke test in live for Users Console: verify optimistic upsert visibility after adding a user with various filters/sorts.
- Weights queue drain check: block POST temporarily, save in admin-weights, confirm leaderboard updates immediately and POSTs retry until success.
- Add visible error panel to analytics-react when both live fetch and cache are unavailable, with “Retry Fetch / Logout / Check Network” buttons. (Completed: Failure card with Retry, Diagnostics, Use Cache, Clear Cache, Logout)
- Optional parity: mirror the AM autosave/tab persistence and enhanced weekly entries rendering to activity-entry-ae.html.
- Documentation: this README updated; if additional field troubleshooting is needed, add step-by-step diagnostics to the Deployment Diagnostics page.

### 2025-09-21 — Activity Overview Performance Fixes (1–5) Completed
- Implemented windowed pagination for Recent Activities (25/50/100) with page controls; default 25 per page; avoids rendering entire list.
- Added robust deduplication for activities by id plus (userId + date + metrics signature) to eliminate duplicates in “This Week’s Entries” and ensure accurate totals.
- Unified, canonical metric mapping covering all requested activity types, including Vidyard, ABM variants (general/cross/up-sell/dormant), meetings booked/conducted, successful contacts, opportunities/referrals generated, pipeline and revenue. Recent + totals now use the same set.
- Totals and Trend now compute from a single de-duplicated dataset scoped to the current period; prevents double inclusion from multiple sources. Trend chart uses deduped data as well.
- Memoization: KPI compute results are memoized by dataset signature and period to reduce recomputation and improve responsiveness on filter toggles and minor UI changes.
- Diagnostics: recent count reads “X of Y shown”; pager visible only when items exist.

## Automated Regression Tests and CI
- Health & Self-Heal
  - Added tests/health.html: one-click automated health audit (API base probe, key pages, JSON summary)
  - Added tests/repair/self-heal.html: clear tokens, warm up API, kick Goals queue, reset caches
- Cypress Suite
  - regression.cy.js (navigation, role security, JSON contracts for legacy portal)
  - health.cy.js (runs health.html, core probes)
  - rbac.cy.js (admin/non-admin gates across consoles including next-gen goal-setting)
  - queue.cy.js (simulated 403 WAF for publish → enqueues items)
- CI Gate
  - GitHub Actions ci.yml now fails the build on any Cypress failure; do not publish until green

- Cypress suite added (cypress/e2e/regression.cy.js) covering:
  - Navigation: universal Home and #home-button behavior
  - Role security: admin-only Goal Setting link; 403 JSON for non-admin direct access with ?json=1
  - JSON contracts: Save Draft / Update / Publish exact messages and payload presence via pre#jsonResponse
- CI workflow (.github/workflows/ci.yml) runs Cypress against a static server (serve -s) on push/PR.

## Snapshot Publish Troubleshooting (Goals Portal)
If Publish fails in goals-portal.html:
1) Confirm schema exists: goals_snapshots fields [id, month, weeks, values, userId, updated_at].
2) Use the Warm-up & Retry button. It probes tables/users and kicks the snapshot queue.
3) Check the Queue chip (Q: n). Non-zero means queued/retrying publishes are pending. They retry every ~15s with exponential backoff and jitter, and switch to success once the API accepts writes.
4) Dashboards continue to work from local caches (goals_snapshot_{YYYY-MM} and goals_cache_role_*). You’ll also see goals_updated events fired so analytics and dashboards refresh.
5) Deployment note: ensure your CDN/WAF allows JSON on /tables/* and does not inject HTML challenges. If it does, the app will auto-warm and retry.

## Public URLs and API Endpoints
- Removed: login.html, login-mockup.html (replaced by index.html)
- App (authenticated home): app.html — fixed left-hand navigation SPA shell. Right content pane loads pages via iframe with ?embed=1. ADMIN-tagged items only visible to admins. Hamburger on mobile. Previous top-nav usage is deprecated in favor of this shell. A new Home landing (home.html) provides quick actions, KPIs, and module tiles and is the default route inside the shell.
  - Analytics: consolidated to analytics-react.html and labeled simply “Analytics” in the nav. Legacy analytics-dashboard.html has been removed. Updated to use jsDelivr CDN for React/Redux/Recharts to avoid unpkg CORS/redirect issues in published builds. New hardening: warm-up HEAD/GET probes, stronger backoff with jitter, cache pre‑hydrate to avoid blank UI, and a guaranteed Fallback Mode that renders immediately if CDNs are blocked (with cached KPIs + diagnostics). 3D heatmap now gracefully falls back to 2D or HTML grid if WebGL/libs are unavailable. Resilient API wrappers upgraded (AbortController timeouts, HTML/WAF detection, cb cache-busting).
  - Admin-only panel additions: Admin Tools (TEST ONLY) and Audit Logs (admin-logs.html)
- Goal Setting (Admin only): goals-portal.html (snapshot-first). Legacy goal-setting pages have been removed. Supports embed mode (?embed=1) to hide its own header when inside the SPA shell.
- Goals Portal (Admin only): goals-portal.html (snapshot-first). Note: Demos and Proposals are not part of the goal-setting metrics.
- Admin Users Console: admin-users.html; Admin Sandbox (no live writes): admin-sandbox.html
- Leaderboard Weights (Admin): admin-weights.html
- Leaderboard: leaderboard.html (supports embed=1)
- Activity Entry (AM): activity-entry-am.html
- Activity Entry (AE): activity-entry-ae.html
- Sales Dashboard (modular, default): sales-dashboard-modular.html (shows a Last updated chip)
- Goals Portal (full flow): goals-portal.html (snapshot-first admin portal; draft caches snapshot locally; publish writes to tables/goals_snapshots and broadcasts to all pages). Note: Demos and Proposals are deliberately excluded from Goal Setting metrics.
- Next‑Gen Goal Setting (removed): replaced by goals-portal.html snapshot-first architecture.
- Goal Portal Seeder (dev only): goals-seed.html (populate role_types, metrics, a published period, baseline entries)
- KPI Snapshot Debug (Admin): kpi-snapshot-debug.html
- RESTful Table API (relative, CORS-enabled):
  - New for Goal Portal: tables/goal_periods, tables/goal_entries, tables/metrics, tables/role_types
  - GET/POST/PATCH/DELETE tables/{table}
  - Example endpoints used: tables/users, tables/activities, tables/goals, tables/leaderboard_weights, tables/audit_logs, tables/goal_periods, tables/goal_entries, tables/metrics, tables/role_types

## API Contracts (for frontend and optional backend)

These contracts define what the dashboards expect. All endpoints must be authorization-free and CORS-enabled for this static SPA.

- tables/activities
  - Method: GET tables/activities?limit=2000
  - Record shape (subset):
    - id (string), userId (string), role ('ae'|'am'), date or createdAt (timestamp)
    - Activity metrics: accountsTargeted, callsMade, emailsSent, linkedinMessages, vidyardVideos, abmCampaigns
    - Result metrics: meetingsBooked, successfulContacts, meetingsConducted, opportunitiesGenerated, referralsGenerated
    - Financial metrics: pipelineGenerated, revenueClosed
    - AM ABM (optional): generalAbmCampaigns, crossSellAbmCampaigns, upSellAbmCampaigns, dormantAbmCampaigns

- tables/goals
  - Method: GET tables/goals?limit=1000
  - Record shape:
    - id, role ('ae'|'am'), month (YYYY-MM), period ('month'|'week'), metric (string key), target (number), weeks (number, usually 4 or 5), userId: null for role-global
  - The app derives week↔month values when one is missing using weeks

- tables/users
  - Method: GET tables/users?limit=1000 and GET tables/users/{id}
  - Record shape: id, email, name, role ('admin'|'ae'|'am'), is_active (bool)

- tables/audit_logs
  - Method: POST tables/audit_logs
  - Record shape: action (string), target_table (string), target_id (string), actor_id, actor_email, details (object), timestamp (ms)

- Optional backend microservice: /kpi-summary (proposed)
  - Purpose: Provide pre-aggregated per-user KPI snapshots to reduce client compute
  - Example: GET /kpi-summary?userId={id}&role={ae|am}
  - Response shape:
    {
      userId: string,
      role: 'ae'|'am',
      period: 'week'|'month'|'7days'|'all',
      current: { [metricKey:string]: number },
      previous: { [metricKey:string]: number },
      generatedAt: number
    }
  - Notes: If unavailable, dashboards compute KPIs from tables/activities. Ensure CORS and no-auth for demo parity.

## Goal Setting Portal — Scope and Security
This project is a static SPA. Server-side JWT authentication, protected endpoints, and middleware-based RBAC cannot be implemented here. Instead:
- Admin-only editing is enforced in the UI. Non-admins cannot open the portal.
- Published goals are written to tables/goals for AE/AM dashboards (read-only for sellers).
- A development seeder (goals-seed.html) creates sample role types, metrics, a published period, entries, and an audit log.

Planned/Backend (not implemented in this static build):
- /api/v1/goals service with JWT and role-based middleware (ADMIN full CRUD; AE/AM read-only scoped to their role).
- Endpoints: POST/GET/PUT /goal_periods, POST/PUT /goal_entries, POST /goal_periods/{id}/publish, POST /goal_periods/{id}/clone, GET /analytics/goals-vs-actuals.
- Database schema as outlined (goal_periods, goal_entries, role_types, metrics, audit_logs).

Express pseudocode (for your backend):
- auth: verify JWT, attach req.user with role claim.
- guard: requireRole('admin') for write routes; requireAny(['ae','am','admin']) for reads; apply role filter for AE/AM on GET goal_entries.

Example middleware:
function requireRole(role){ return (req,res,next)=> req.user?.role===role ? next() : res.sendStatus(403); }
function canRead(req,res,next){ if(['admin','ae','am'].includes(req.user?.role)) return next(); res.sendStatus(403); }

Example route shape:
- POST /api/v1/goals/goal_periods {month,weeks_in_month} → 201
- GET /api/v1/goals/goal_entries?goal_period_id=... → admin: full; ae/am: filter by role_type

See README “API Contracts” for more.

## Deployment
To deploy your website and make it live, please go to the Publish tab where you can publish your project with one click. The Publish tab will handle all deployment processes automatically and provide you with the live website URL.

Deployment Gate:
- The app may not be published until all Cypress tests pass in CI (GitHub Actions ci.yml).
- Verify tests/health.html shows all checks passed in a fresh session.
- Review tests/report/last-health.json from the CI artifact if any test fails.

To deploy your website and make it live, please go to the Publish tab where you can publish your project with one click. The Publish tab will handle all deployment processes automatically and provide you with the live website URL.

### Full‑Stack Rebuild Prompts (Genspark)
This repository remains a static SPA. For a production full‑stack rebuild (React/Node/Mongo/Socket.io) and a follow‑up cleanup/consolidation pass, use the ready‑to‑run prompts in:
- docs/GENSPARK_PROMPTS.md

These prompts instruct Genspark (or similar) to generate a monorepo with snapshot‑first goals, Socket.io push, consolidated Analytics, Admin Master Reset endpoints, and standardized navigation. Do not paste server code back into this static repo.

## 2025-09-19 Update 5 — A/B KPI-Lite, Impersonation Test Helpers, Snapshot Debug

## 2025-09-19 Update 6 — Readability Scaling + Admin Login Hardening
- Modular dashboard now includes an A-/A+ UI scale control at the top right of the controls bar. Scaling is applied via CSS variable --ui-scale and persisted in localStorage (ascm_ui_scale). Chart.js instances auto-resize after scale changes.
- Admin login: admin@example.com is now recognized as a seed admin alongside bmiller@ascm.org. Secure SHA-256 hashing/validation already in place; added audit logging of admin login attempts to tables/audit_logs (success and failures). Recovery password br53mi22 still supported for seed admins; on use, the password is migrated to SHA-256.
- Dashboards listen for goals_updated via BroadcastChannel/localStorage and update immediately after admin publishes from goals-portal.html.
- Feature flags (js/feature-flags.js): enable KPI-Lite path via localStorage.setItem('ascm_flag_kpi_lite','1') or query ?ff_kpi_lite=1. When ON, sales-dashboard-modular.html uses js/kpi-lite.js to compute and render minimal KPIs independently and optionally consumes /kpi-summary snapshots when available.
- Admin impersonation test helpers (global via js/shims.js): window.setupActAsUser(user), window.confirmActAsUser(), window.stopImpersonation(). These complement module exports in js/activity-utils.js and are exposed globally for legacy test harnesses. All flows require admin role and write audit logs; dashboards update instantly via BroadcastChannel/localStorage events.
- KPI Snapshot Debug page: kpi-snapshot-debug.html (Admin only). Compares KPI-Lite live aggregates vs a proposed backend snapshot microservice (/kpi-summary). Useful during staged rollout to verify parity. Note: /kpi-summary is not implemented in this static project and must be provided by a backend service (CORS-enabled, no auth for demo).
- Preview/publish parity: dashboards use resilient fetch (path normalization, warm-up GET, retries, cache-busting cb), cached fallbacks, and background auto-recovery to ensure the same behavior in both Preview and Published environments.

## 2025-09-19 Update 7 — Admin Goal Module polish + Dashboard Goals Overview + Legacy Cleanup
- Admin Goal Settings module has been superseded by the unified Goals Portal (goals-portal.html). All features are consolidated here; legacy goal-setting pages have been removed.
- Modular Sales Dashboard (sales-dashboard-modular.html):
  - New read-only Goals Overview table card next to KPI Distribution with meta badge (ROLE · YYYY-MM); respects period (Weekly/Monthly) and money formatting
  - Readability controls: A-/A+ UI scaling via CSS var --ui-scale, persisted in localStorage (ascm_ui_scale); Chart.js instances auto-resize
  - Missing goals guard: shows alert and greys KPI groups when any goal is zero; dashboard remains read-only for goals
  - Donut distribution and trend charts; recent activities with category filters; period filters for Week/Month/7 Days/All; 3D heatmap now falls back to 2D with diagnostics and help links if WebGL is unavailable
  - Per-user KPI enforcement (AE/AM) with optional admin impersonation via localStorage ascm_impersonate; cross-tab sync and cache fallbacks
- Routing and cleanup:
  - All links and shims now target sales-dashboard-modular.html as the canonical dashboard; legacy dashboard UI is removed from navigation
  - No references to sales-dashboard-v2.html remain; existing test harness routes are preserved via js/shims.js
  - Legacy login pages removed (login.html, login-mockup.html) since index.html is the sole entry point

Quick test plan additions
- RBAC: Attempt to open goals-portal.html with a non-admin session — the page should be blocked (client-side gate) at load
- Goals CRUD: Create and edit a goal; verify Dirty badge, Save and Save All behavior; confirm audit_logs are written; open the modular dashboard in another tab to see goals_updated apply immediately
- Resilience: Simulate a WAF/HTML response (e.g., network throttle/proxy); verify warm-up GET, retries, and cached status chips
- Accessibility: Tab through app.html option cards; press Enter/Space to activate; verify keyboard focus outlines and aria labels on buttons/inputs

## 2025-09-21 Update — Dark Mode, Gamification, 3D Heatmap Fallback, Leaderboard Diagnostics, and Master Reset Fix
- Dark mode: Added theme toggling across the app via data-theme="dark" with persisted preference (localStorage: ascm_theme). Rounded elements, smooth transitions, and brand-safe dark palette.
- Gamification: New Weekly Progress bar with milestone badges (25/50/75/100%) and confetti celebration at 100% in sales-dashboard-modular.html. Minimal, modern, and in-brand.
- 3D Activity Heatmap: Now with robust WebGL detection and graceful fallback. If WebGL2/1 is unavailable or disabled, the dashboard automatically renders a 2D canvas heatmap instead, with a visible status chip and a Help panel including browser-specific enablement tips and diagnostics (renderer string when available).
- Progressive disclosure: Recent Activities table is collapsed on mobile with a Details toggle for reduced clutter.
- Vibrant accents: KPI and buttons refined via theme.css for modern rounded look and vibrant but accessible accents.
- Master Reset Fix: Admin Tools now clear all goal-related caches and broadcast a goals_reset event after publishing a zeroed snapshot. Goals Portal and dashboards listen for goals_reset and reload from live, showing zeroed goals immediately.

### Leaderboard: Avatar system + diagnostics + modern layout
- Avatars
  - Centralized avatar utilities (js/avatars.js). Priority: direct avatar_url → LinkedIn via unavatar.io → email via unavatar.io → colorful Boring Avatars fallback.
  - Added retina-friendly Avatars.img2x() with srcset for crisp rendering at 56–72px.
  - Integrated on leaderboard.html and admin-users.html; new avatar-management.html lets users set LinkedIn URL or choose built-in avatars and PATCH to tables/users/{id}. Broadcasts users_updated.
- Diagnostics and resilience for “no data” cases
  - AbortController timeouts, warm-up GET, cache-busting cb, exponential backoff with jitter.
  - Added Diagnostics panel (toggle via bug button). Shows API base, counts (activities/users), status, board/period, last errors.
  - Auto-recovery loop remains; cached-first render; visible Live badge on event-driven updates.
- Modern compact leaderboard layout
  - Clean row list with essential info only: avatar, name, rank, a single key metric, progress bar, and score.
  - Left-aligned avatars/names, right-aligned scores for scanability. Uses ASCM palette (greens/blue accents) across bars and badges.
  - Today and All filters added alongside Week/Month. Current user chip “YOU”; Top 1–3 chip.
  - Perfect avatar fit (object-fit: cover; spacing adjusted). Responsive grid for small screens; no overflow.

## 2025-09-20 Update — SPA Shell + Admin Master Reset
- Implemented persistent left-hand navigation SPA shell (app.html) with right-pane iframe content loading via ?embed=1. Sidebar remains visible across the app; active item highlight and ADMIN tags included; responsive hamburger on small screens.
- Added Admin Tools (admin-tools.html): Admin-only Master Reset utilities to:
  - Dry run counts
  - Reset all activities (DELETE tables/activities/*)
  - Reset goals: DELETE tables/goals and tables/goals_snapshots, then publish a zeroed snapshot for current month
  - Broadcasts activities_reset/goals_updated; shows ribbon, toasts, JSON summary, and progress
  - Uses resilient fetch (path normalization, cache-busting cb, warm-up GET, retries with jitter)
- Embed mode added to major pages (goals-portal.html, analytics-react.html, leaderboard.html, sales-dashboard-modular.html, admin-users.html). When ?embed=1, page headers and Home buttons are hidden to avoid double navigation when loaded inside the SPA shell.


- Activity sync and impersonation
  - createActivity/deleteRecord now invalidate API caches and broadcast activities_updated with the affected userId so dashboards scoped to other users do not refresh unnecessarily
  - sales-dashboard-modular now ignores activities_updated events for non-active user scopes; it refreshes immediately only when the incoming userId matches the active user (including admin impersonation)
  - Added debounce and overlap guard (_refreshing) so parallel events don’t cause duplicate fetches
  - Added detailed telemetry logs (window.AscmTelemetry) for storage/broadcast events and timer set/clear
- Event-driven refresh policy
  - Removed 30s frequent polling from salesDashboard.js; the dashboard refreshes on events (storage + BroadcastChannel), user actions, and optional long-interval polling
  - Optional periodic refresh can be enabled via localStorage: ascm_periodic_refresh_minutes >= 5. Example: localStorage.setItem('ascm_periodic_refresh_minutes','10')
  - Loading overlay now appears only during actual fetches; timers are de-duplicated and cleared when disabled
- KPI trend comparison and accessibility
  - Restored consistent prior-period comparisons across all KPI cards; added accessible aria-labels for trend statements and progress bars
  - Trend icons standardized with up/down/minus and percentage formatting
- Optional push channels
  - Modular dashboard can also consume optional SSE/WebSocket push. Configure with:
    - localStorage.setItem('ascm_sse_activities_url','https://your-host/events/activities')
    - localStorage.setItem('ascm_ws_activities_url','wss://your-host/ws')
  - Analytics dashboard now also supports SSE/WS for goals updates:
    - localStorage.setItem('ascm_sse_goals_url','https://your-host/events/goals')
    - localStorage.setItem('ascm_ws_goals_url','wss://your-host/ws')
- Admin Goal Setting Portal (unified SPA route)
  - In app.html, Admin navigation points to the unified Goals Portal (goals-portal.html). No modal or hash routing remains.
- Testing guidance (impersonation sync)
  1) Open activity-entry-ae.html (as admin, impersonate a user) and sales-dashboard-modular.html in another tab
  2) Save an activity. Confirm the dashboard tab updates immediately and only if its active user matches the impersonated user
  3) Clear impersonation; dashboard reverts to your own scope


### Snippets (pseudocode/React)
- Activity save with real-time update (pseudocode)
  async function handleSaveActivity(payload){
    const imp = JSON.parse(localStorage.getItem('ascm_impersonate')||'null');
    if (imp) payload = { ...payload, userId: imp.id, role: imp.role };
    const res = await fetch('tables/activities', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const ok = res.ok;
    // Invalidate caches; broadcast success with scoped userId
    ['activities?limit=2000','/tables/activities?limit=2000','tables/activities?limit=2000'].forEach(k=>localStorage.removeItem(k));
    localStorage.setItem('ascm_activities_updated', String(Date.now()));
    try { new BroadcastChannel('ascm_sync').postMessage({ type:'activities_updated', at: Date.now(), userId: (imp?.id || (JSON.parse(localStorage.getItem('ascm_session')||'null')||{}).id) }); } catch{}
    return ok;
  }
- KPI trend component (React UMD-style)
  function TrendBadge({ current, previous, label='vs prior' }){
    const pct = previous>0 ? Math.round(((current-previous)/previous)*100) : (current>0?100:0);
    const dir = pct>0? 'up' : (pct<0? 'down' : 'neutral');
    const icon = pct>0? 'fa-arrow-up' : (pct<0? 'fa-arrow-down' : 'fa-minus');
    const aria = `Trend ${dir} ${Math.abs(pct)}% versus previous period. Current ${current}, previous ${previous}.`;
    return (
      <span className={`trend-badge ${dir==='up'?'trend-up':dir==='down'?'trend-down':'trend-neutral'}`} aria-label={aria}>
        <i className={`fas ${icon}`} aria-hidden="true"></i>{Math.abs(pct)}%
      </span>
    );
  }
- Timer management (avoid overlaps, event-driven first)
  let refreshing=false, periodic=null;
  async function refresh(){ if (refreshing) return; refreshing=true; try{ /* fetch+render */ } finally { refreshing=false; } }
  function schedulePeriodic(minutes){ if (periodic) clearInterval(periodic); if (!minutes||minutes<5) return; periodic = setInterval(()=>{ if(!document.hidden) refresh(); }, minutes*60000); }
  // Events -> refresh(); User click -> refresh(); Preference -> schedulePeriodic(parseInt(localStorage.getItem('ascm_periodic_refresh_minutes')||'0'));

