# Runway bank-sync integration plan

## Current status

The app currently supports manual transaction entry, CSV/XLS/XLSX bank-statement import, pasted transaction SMS parsing, and an optional Android-oriented SMS capture flow. It does **not** currently have an authorized bank-data provider, a live Account Aggregator connection, or a verified provider callback. The Bank connections page must continue to say "Setup required" until all of these are true.

## Recommended data source

Start by evaluating an India-supported, authorized Account Aggregator (AA) / banking-data integration partner. In India, AA data sharing is based on explicit, purpose-bound user consent; phone-number verification alone is not permission to retrieve transactions. Eligibility requirements for Runway as a Financial Information User (FIU), or the need to work through an eligible regulated partner, must be confirmed with the selected provider and qualified compliance counsel before launch.

Do not scrape Paytm or bank apps, ask users for bank passwords / UPI PINs, intercept OTPs, or imply that Paytm offers a personal transaction-history API unless the provider contract and official API documentation confirm it. A bank statement can include Paytm UPI payments when the payment is recorded by the linked bank, but it will not necessarily expose the full Paytm wallet history.

## Intended architecture

1. **Web + Android client**: user selects "Connect bank"; client requests a one-time session from Runway's server endpoint and redirects/opens the provider-hosted consent flow.
2. **Server-side provider adapter**: provider credentials live only in Zite secrets/server configuration. The server creates a provider session and validates all callback signatures, state, and session ownership.
3. **Consent lifecycle**: persist provider connection ID, consent status, granted data scope, expiry and revocation state against the authenticated user. Do not store provider login credentials or UPI PINs.
4. **Transaction retrieval**: server fetches data only under valid consent; normalize into Runway's transaction shape (date, amount, direction, description, account/source reference); validate currency and dates.
5. **Deduplication and review**: use a stable provider transaction ID when available. Enforce a unique key scoped to user + provider + account + provider transaction ID. If no stable ID exists, use a documented fingerprint and allow review of ambiguous matches. Never silently import duplicates.
6. **Existing finance engine**: import confirmed transactions through the existing authenticated transaction API, preserving user ownership and refreshing the existing shared finance engine. Do not change forecast logic to make the sync appear live.
7. **Refresh and disconnect**: support provider-authorized refresh/pull where permitted, show last successful sync, surface failures and allow revocation/disconnection. After revocation, stop fetching immediately and clear tokens/connection secrets according to provider requirements.
8. **Audit and privacy**: collect minimum necessary data, use TLS, verify webhook authenticity, rate-limit endpoints, avoid transaction details in logs, define retention/deletion policy, and document consent purpose and support contact.

## Required server endpoints (not implemented until provider is selected)

- `POST /bank-sync/session`: authenticated user; creates a one-time provider consent session with CSRF/state protection.
- `GET /bank-sync/callback` or provider webhook: validate provider response/signature and bind the connection to the initiating user.
- `POST /bank-sync/refresh`: request a provider-permitted refresh for an active consent.
- `POST /bank-sync/disconnect`: revoke access where supported and mark the connection disconnected.
- `GET /bank-sync/status`: return safe status only (provider, linked institution label if available, consent status, last sync time, next action). Never return provider secrets or tokens to the browser.

Use the exact endpoint conventions and auth helpers supported by the connected Zite backend after inspecting the generated `.zite` runtime. Do not implement endpoints against guessed SDK methods.

## Data model proposal

- `bank_connections`: id, user_id, provider, provider_connection_id (server-only if sensitive), institution_label, consent_status, consent_scopes, consent_expires_at, last_synced_at, created_at, disconnected_at.
- `bank_sync_runs`: id, user_id, connection_id, status, started_at, completed_at, imported_count, duplicate_count, safe_error_code.
- Add source metadata to imported transactions: `source_type='bank_sync'`, `source_connection_id`, `provider_transaction_id` (server-side/internal fields; never trust client-supplied ownership).

Apply row-level ownership checks to every operation. Treat provider transaction text as untrusted data.

## Mobile support

The existing app is a responsive web app. The first release can support Android through the browser or an installed PWA if the provider's consent flow supports it. Native SMS reading or background syncing is a separate Android-specific permission/release concern; do not imply that a website can silently read phone SMS. Prefer bank-authorized data sharing over SMS capture.

## Acceptance criteria before enabling the Connect button

- Provider contract / sandbox access and credentials are configured in server-only secrets.
- Authenticated user can start and finish provider consent on desktop and Android browser.
- Callback authenticity, CSRF/state, user binding and consent scopes are verified server-side.
- Transactions import only for the initiating user, with stable deduplication and safe retries.
- Revoked/expired consent stops syncing; disconnect and data deletion work.
- Tests cover unauthorized users, invalid callback, expired consent, duplicate deliveries, partial provider outage and malformed transactions.
- Run typecheck, production build, provider sandbox tests, and Zite preview smoke tests.
- Only after all checks pass should the UI status and connect flow be enabled.

## Provider evaluation checklist

Compare provider coverage of the user's bank, UPI/bank transaction data availability, sandbox quality, API/SDK and hosted consent flow, callback security, pricing, refresh rules, contractual eligibility, support SLA, data residency/retention, and cancellation/revocation behavior. Confirm these details directly with the provider; do not assume that a bank-sync provider can retrieve Paytm wallet-only transactions.
