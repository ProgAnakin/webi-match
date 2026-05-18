# ADR 005 — Synchronous PII Encryption Before Email Dispatch

**Date:** 2026-05-18
**Status:** Accepted (supersedes the fire-and-forget pattern in `on-session-created`)

## Context

The `on-session-created` Edge Function does three things in sequence when a new `quiz_sessions` row is inserted:

1. Generates a unique discount code and writes it back to the session row.
2. Encrypts the customer's `nome` / `cognome` via `pgp_sym_encrypt` and writes a SHA-256 hash of the email (the `encrypt_session_pii` RPC). Plaintext `nome`/`cognome` columns are left in place by the trigger; only the `_enc` columns and `email_hash` are added.
3. Sends a personalised HTML email via Brevo containing the customer's name and discount code.

The original implementation invoked `encrypt_session_pii` as a **fire-and-forget** promise:

```ts
supabase.rpc("encrypt_session_pii", { ... }).then(({ error }) => {
  if (error) console.error("[on-session-created] pii encrypt failed:", error.message);
});
```

The function then proceeded to dispatch the email via Brevo without awaiting the encryption result.

## Problem

The fire-and-forget pattern silently broke the "encryption at rest" guarantee documented in [ADR 003](./003-pii-encryption-at-rest.md):

- If `pgcrypto` is misconfigured, the `PII_ENCRYPTION_KEY` secret rotates without a backfill, or the RPC raises an error for any reason — the promise rejection was logged but the function continued.
- Brevo then received the customer's plaintext name and successfully sent the email.
- The customer experience was unaffected, but the database now held a row where `nome` and `cognome` were still in plaintext, the encrypted columns were null, and the email had already left the building.

In the breach-recovery model that justifies database-layer encryption ("a stolen `pg_dump` is useless without the key"), this state is **worse than no encryption** because the failure is invisible: nothing alerts an operator, the row looks like dozens of others, and the assumption that any row written by this function is encrypted is silently false.

## Decision

Make the encryption call **synchronous** in the request handler. On failure, return HTTP 500 and **do not** dispatch the email.

```ts
if (PII_KEY) {
  const { error: encErr } = await supabase.rpc("encrypt_session_pii", { ... });
  if (encErr) {
    console.error("[on-session-created] pii encrypt failed — aborting email send:", encErr.message);
    return new Response(JSON.stringify({ ok: false, error: "encryption failed" }), { status: 500 });
  }
}
```

## Consequences

**Positive:**

- The encryption-at-rest guarantee holds for every email that leaves the system. If an attacker later compromises a database dump, every row whose `email_sent = true` is also encrypted.
- The Supabase database webhook will retry the call on 500 — encryption is idempotent (uses `UPDATE … WHERE id = $1`) so retries are safe.
- A failing encryption now surfaces immediately in Edge Function logs and webhook delivery dashboards instead of silently degrading PII protection.

**Negative / accepted trade-offs:**

- Email delivery now has a single additional dependency: if `pgcrypto` or the `encrypt_session_pii` RPC is broken, all emails stop. This is intentional — silent partial encryption is a worse failure mode than a noisy outage.
- Edge Function latency increases by ~10-50 ms (one DB round-trip). Acceptable for a non-interactive webhook.
- If `PII_ENCRYPTION_KEY` is not configured, the function skips encryption entirely (the `if (PII_KEY)` guard). This is preserved for local development and existing deployments that opted out of encryption.

## Alternatives considered

1. **Encrypt and email in a single transaction.** Not possible — Brevo is an external HTTP API outside Postgres's transaction boundary.
2. **Mark `email_sent = true` only after encryption confirms.** Doesn't help — Brevo has already accepted the email by then, and the row state would just be confusing.
3. **Background retry queue for encryption.** Adds infrastructure (queue, worker, monitoring) without changing the visible failure mode: an attacker who steals the DB between the email send and the retry still gets plaintext.

## Validation

Manual smoke test before deploy:

```bash
# In Supabase SQL Editor, temporarily revoke execute on encrypt_session_pii:
REVOKE EXECUTE ON FUNCTION public.encrypt_session_pii(uuid, text, text, text, text) FROM service_role;

# Insert a fake session, observe the webhook 500s and no email was sent:
INSERT INTO quiz_sessions (email, matched_product_id, match_percent, store_id, language)
VALUES ('test+adr005@example.com', 'blnd-blender', 50, 'corso-vercelli', 'it');

# Restore:
GRANT EXECUTE ON FUNCTION public.encrypt_session_pii(uuid, text, text, text, text) TO service_role;
```
