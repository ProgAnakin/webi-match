# Security Policy

## Reporting a Vulnerability

If you believe you have found a security vulnerability in Webi-Match, please **do not open a public GitHub issue**. Instead, report it privately so the issue can be triaged and a fix can be coordinated before disclosure.

Send a private report by either:

- Using GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) flow on this repository, **or**
- Emailing the maintainer directly at `costanzo.annichini@gmail.com`

Please include, where possible:

- A clear description of the issue and its potential impact
- Steps to reproduce (or a proof-of-concept)
- The version / commit hash where the issue was observed
- Whether the issue affects production, staging, or local environments
- Any relevant logs, request payloads, or screenshots — **excluding real customer PII**

You should receive an acknowledgement within **3 business days**. The maintainer will work with you on a remediation timeline, typically aiming for a fix within 14 days for high-severity issues and 30 days for medium / low severity.

## Scope

In scope:

- The kiosk web app (`/`)
- The manager dashboard (`/manager`)
- The stats dashboard (`/stats`)
- The Supabase Edge Functions (`on-session-created`, `verify-pin`, `relay-to-sheets`)
- SQL migrations and database functions
- Build / CI configuration

Out of scope:

- Third-party services (Supabase, Brevo, Vercel, Sentry, Google Sheets) — please report directly to the vendor
- Issues that require a privileged role already (e.g. a malicious authenticated `manager` user) unless they break the privilege boundary itself
- Denial-of-service via traffic volume — the deployment lives behind a CDN/edge platform
- Social engineering of the store staff

## Hardening Already In Place

Webi-Match was built defensively from day one. The following protections are part of the current codebase:

### Authentication & Authorisation
- Supabase Auth + bcrypt PIN fallback for staff access
- Constant-time comparison on PIN check (timing-attack resistant)
- In-memory IP-based lockout (5 failed attempts → 2-minute lock, 5-minute window)
- MFA enforced on the stats dashboard
- Row-Level Security on every table
- Role-based access via `store_roles` (`manager` / `consulente_responsabile`) — managers see all stores, consultants only their own

### PII Protection
- AES-encrypted `nome` / `cognome` at rest (`pgp_sym_encrypt`)
- SHA-256 hashed email for deduplication lookups (`email_hash`)
- Encryption keys stored as Supabase Edge Function secrets, never in code or env files

### Rate Limiting
- Server-side 1-email-per-hour cooldown per address (cannot be bypassed from client)
- DB-level failed-login tracking
- PIN endpoint rate-limited per IP

### Injection Defence
- All session search inputs escape `%`, `_`, `\` before interpolation into PostgREST `.or()` filter
- `escHtml()` applied to every user-supplied field rendered in transactional emails
- `safeUrl()` validates `https://` prefix on all product URLs before injecting into emails
- `stripHtml()` sanitises custom-product name and description on save

### Transport & CORS
- HTTPS-only (HSTS via `vercel.json`)
- Strict `ALLOWED_ORIGIN` allowlist on Edge Functions — no wildcard fallback in production
- Silent rejection of unexpected origins (no information leakage)
- CSP and SameSite cookie settings declared in `vercel.json`

### Webhook Surface
- Database webhooks gated by an allowlist of valid `store_id` values
- Unknown stores silently dropped with no error response (no fingerprinting)

### Observability
- Sentry error tracking + session replay (replay on error only)
- Audit log of every dashboard write action (`manager_audit_log`)
- PIN access log with IP and user-agent (`admin_access_log`)

### Build & CI
- Typecheck, lint, test and build run on every push, PR, and feature branch
- Bundle is code-split — admin routes lazy-loaded so secrets paths never reach the kiosk bundle
- Stub env vars in CI (`VITE_SUPABASE_URL=https://placeholder.supabase.co`) — real secrets only live in Vercel / Supabase

## Out-of-Band Disclosure

If a fix requires coordinated disclosure (e.g. a vulnerability impacting customer PII), the maintainer will publish a `GitHub Security Advisory` and credit the reporter (with consent) in the changelog.

Thank you for helping keep Webi-Match safe.
