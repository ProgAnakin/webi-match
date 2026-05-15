# ADR 003 — PII Encryption at the Database Layer

**Date:** 2026-04-29  
**Status:** Accepted

## Context

Quiz sessions store customer PII: first name, last name, and email address. This data is:

- Needed by the `on-session-created` Edge Function to compose and address the confirmation email.
- Retained in `quiz_sessions` for manager-dashboard session history and analytics.
- Subject to GDPR data minimisation and security obligations.

Three options were considered for protecting names and email:

1. **No encryption** — store plaintext, rely on RLS.
2. **Client-side encryption** — encrypt in the browser before insert; decrypt in the browser after fetch.
3. **Database-layer encryption** — encrypt and decrypt inside PostgreSQL using `pgcrypto`.

## Decision

**Database-layer encryption** (`pgp_sym_encrypt` / `pgp_sym_decrypt`) for `nome` and `cognome`. SHA-256 hashing (`encode(digest(email, 'sha256'), 'hex')`) for email.

## Rationale

**Why not client-side encryption?**

Client-side encryption would mean the symmetric key lives in the JavaScript bundle or in an env var readable in the browser — which is equivalent to no encryption at all if the source can be inspected. It also means the Edge Function receives plaintext over HTTPS, so TLS is the only protection in transit.

**Why database-layer encryption for names?**

`pgp_sym_encrypt` runs inside a DB trigger and uses a key stored as a Supabase Edge Function secret (never in code, never in env files, never in the bundle). A compromised application layer — including Supabase's API gateway — cannot read plaintext names without the key. The key is only reachable from Edge Function code via `Deno.env.get("ENCRYPTION_KEY")`.

**Why hash the email instead of encrypting it?**

Encrypted columns are opaque to equality comparisons. The server-side email cooldown RPC (`check_email_cooldown`) needs to look up recent sessions by email to enforce the 1-hour-per-address limit. SHA-256 is a one-way hash — it enables deduplication lookups without storing the plaintext — and it cannot be reversed to recover the original address. The actual email is only needed in the Edge Function to send the transactional email; it is never persisted in plaintext.

## Consequences

- `nome_enc` and `cognome_enc` columns hold ciphertext; the application never reads plaintext names directly from `quiz_sessions`.
- `email_hash` enables deduplication and rate-limiting without storing plaintext email.
- The encryption key is rotatable: a new `ENCRYPTION_KEY` secret can be set in Supabase dashboard and a migration can re-encrypt existing rows.
- Any DB dump or storage backup is useless to an attacker without the `ENCRYPTION_KEY` secret.
- The `on-session-created` Edge Function decrypts names inline when building the personalised email; it does not persist decrypted data anywhere.
- Reviewers should verify that no migration or RPC ever returns plaintext PII to an `anon` role.
