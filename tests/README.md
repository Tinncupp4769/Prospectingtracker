# Test and Health Infrastructure

This folder contains automated health audits, self-heal tools, and documentation to validate and maintain the ASCM Sales Activity Tracker.

## Components
- tests/health.html: In-browser health runner that probes API base, verifies key pages/components, and produces a JSON summary (window.HEALTH_RESULT). Designed for CI and manual runs.
- tests/repair/self-heal.html: Quick-fix toolkit for clearing tokens/sessions, sending API warm-up requests, kicking the Goals async queue, and cleaning local caches.

## Running Locally
1) Serve the repo (e.g., `npx serve -s . -l 8080`).
2) Open tests/health.html, click "Run Checks". A JSON result is produced and displayed.

## CI Integration
- Cypress specs under cypress/e2e include health.cy.js and rbac.cy.js in addition to regression.cy.js.
- GitHub Actions workflow runs a static server and executes Cypress.

## Deployment Gate
Do not publish unless all tests pass. Use the **Publish tab** only after the CI pipeline is green and the health page shows all checks passed.
