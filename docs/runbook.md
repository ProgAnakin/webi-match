# Operational Runbook

Triage guide for the most common incidents on a webi-match deployment. Each
section: **symptom → first checks → fix**. If none of the fixes apply, escalate
with a copy of the relevant Edge Function logs and the affected `quiz_sessions.id`.

---

## 1. Customer didn't receive the discount email

**Symptom:** customer finished the quiz, saw the success screen, but no email
arrived (including spam folder).

**Triage order:**

1. **Brevo log first.** Dashboard → Statistics → Emails. Search by recipient
   address.
   - `Consegnata` / `Inviata`: email left Brevo. Ask the customer to check
     spam + the address they typed. Compare with `quiz_sessions.email` row.
   - `Bloccata` / `Blocked`: recipient is on Brevo's suppression list (prior
     unsubscribe, hard bounce, or spam complaint). Fix: Brevo → Contacts →
     find the address → **Resubscribe** / **Remove from blocklist**. Send
     again only with the customer's explicit consent.
   - `Errore` / `Error`: usually the wrong sender or DKIM failure. Check the
     sender shown in the log — must be `costanzobruno.annichini@webidoo.com`.
     If it's something else, the Edge Function deployment is stale; redeploy
     `on-session-created` from the Dashboard.
   - **Nothing logged at all:** the Edge Function never called Brevo. Continue
     to step 2.

2. **Edge Function logs.** Supabase Dashboard → Edge Functions →
   `on-session-created` → Logs. Filter by the `session_id` (it's logged on
   the success line).
   - `[on-session-created] db update failed — aborting email`: the pre-send
     UPDATE to `discount_code` failed. Usually a transient DB issue. Check the
     row in `quiz_sessions` — if `discount_code` is NULL but `email_sent` is
     false, you can manually retrigger by re-firing the webhook (Database →
     Webhooks → `on-session-created` → Send test event with the row payload).
   - `[on-session-created] pii encrypt failed`: `PII_ENCRYPTION_KEY` secret
     is set but invalid. Either fix or remove the secret (the function works
     without it — plaintext fallback with a warning).
   - No log at all for the session: the webhook isn't firing. Continue to
     step 3.

3. **Webhook config.** Database → Webhooks → `on-session-created`.
   - Confirm: table = `quiz_sessions`, event = `Insert`, type = Edge Function.
   - HTTP Headers must include `x-webhook-secret` matching the `WEBHOOK_SECRET`
     secret on the Edge Function. Mismatched secrets cause silent 200 rejections.
   - Click **Send a test event** with a known row — if it doesn't trigger,
     the webhook is broken; recreate it.

4. **Rate limit.** Each email address gets one email/hour by design (server
   side, in `on-session-created`). Check `quiz_sessions` for another row
   from the same email with `email_sent = true` and `created_at > NOW() - '1
   hour'`. If you need to bypass for staff testing, add the address to the
   `WHITELIST_EMAILS` secret on the Edge Function (comma-separated list).

---

## 2. Kiosk stuck on the loading spinner

**Symptom:** customer taps "Start" and the rotating-card screen never advances
to the quiz.

**Triage:**

1. **Offline?** Look at the top of the screen — if the amber "offline" banner
   is showing, the kiosk lost network. Check the iPad's WiFi. The cache is
   designed to serve the last-known catalog so the quiz should still load
   from cache; if not, the cache was never written (first-time load on this
   device).

2. **First-time load on this iPad with bad network?** The startup `Promise.all`
   now has a `.catch` that forces `settingsLoadFailed = true` and lets the
   user proceed with the bundled fallback questions/products. The fallback
   timeout is 10 s. If you see a flash of the loading screen and then the
   welcome screen with an amber "Catalog offline" badge, the fallback fired.

3. **Catalog still loading after 10 s with good network?** Open DevTools
   (Brave: `Cmd+Shift+P`) and check the Network tab for failed Supabase calls.
   Typically one of `product_settings`, `custom_products`,
   `product_global_status`, `quiz_cards` returning a 401/403 — RLS broken
   for the anon role. Check the latest migrations for any policy that may
   have been dropped.

---

## 3. PIN login failing repeatedly

**Symptom:** staff enters the right PIN and gets "Incorrect PIN" or the
lockout message.

**Triage:**

1. **STAFF_PIN secret matches what staff is entering?** Supabase Dashboard →
   Edge Functions → `verify-pin` → Secrets. The value is plaintext — confirm
   no leading/trailing spaces.

2. **Rate limited?** The function rate-limits per IP: 5 failures within 5 min
   trigger a 2-min lockout. The countdown is shown in the UI. The in-memory
   counter resets on Edge Function cold start (every ~15 min of idle); if a
   staff member is convinced they were just blocked, wait or restart by
   redeploying the function.

3. **Fallback to DB path active?** If `STAFF_PIN` is NOT set, the function
   falls back to bcrypt against `app_config.staff_pin_hash`. Confirm migration
   `20260507000004` ran. The DB path uses the `verify_staff_pin` RPC which
   tracks its own attempts in `pin_lockouts` — query that table to see what
   the server saw.

---

## 4. /manager dashboard shows empty data or "forbidden"

**Symptom:** signed-in user reaches /manager but tabs are empty or show 403.

**Triage:**

1. **Does this user have a `store_roles` row?** Supabase → SQL Editor:
   ```sql
   select sr.role, sr.store_id, u.email
     from store_roles sr
     join auth.users u on u.id = sr.user_id
    where u.email = '<their-email>';
   ```
   If no row, they have no permissions. Insert one via the /manager → Ruoli
   tab (signed in as another manager) or via SQL with the service role.

2. **Consulente sees nothing in Storico?** Expected — they only see audit
   entries for their own `store_id`. If the historical rows were inserted
   before the `store_id` column was added (migration `20260429000004`), their
   `store_id` is NULL and consulenti can't see them. Managers still see all.

3. **"forbidden: caller is not a manager":** The Roles tab uses
   `*_store_roles_admin` RPCs that explicitly require the `manager` role.
   Consulenti can't manage other users by design.

---

## 5. Email rendering looks broken (raw `<strong>` tags etc.)

**Symptom:** customer received the email but it shows literal HTML tags.

**Cause:** the `header_title` / `header_subtitle` template fields are
intentionally rendered as raw HTML. If a manager pasted text containing
`<` that wasn't a real tag, the email client renders the rest of the body
incorrectly.

**Fix:** Manager → Template Email tab → pick the affected language → either
remove the stray `<`/`>` characters or wrap them in HTML entities (`&lt;`,
`&gt;`). Save. The next email uses the new template (no deploy needed).

---

## 6. Storage usage growing fast

**Cause:** `quiz_sessions` and `manager_audit_log` grow unbounded by default.

**Fix:**

- Sessions older than 30 days: from /manager → Sessions tab, or via SQL:
  ```sql
  select purge_sessions_older_than(30);
  ```
- Audit log older than 2 years (manager-only):
  ```sql
  select purge_audit_log_older_than(730);
  ```
  The function refuses to purge less than 180 days of history.

---

## 7. Edge Function redeploy didn't take effect

**Symptom:** updated code in repo but production still behaves as before.

**Cause:** Vercel auto-deploys frontend from GitHub on push to `main`. Supabase
Edge Functions do **not** auto-deploy. You must redeploy manually.

**Fix:**

```bash
# Locally with the Supabase CLI
supabase functions deploy on-session-created
supabase functions deploy verify-pin
supabase functions deploy relay-to-sheets
```

Or via the Dashboard → Edge Functions → click the function → copy/paste
`supabase/functions/<name>/index.ts` from the repo → Deploy.

---

## 8. Changing the staff PIN

The staff PIN (used by the AdminPinOverlay and the manager/stats login)
is verified by the `verify-pin` Edge Function. It has **two sources**:

- **Primary** — the `STAFF_PIN` Edge Function secret (plaintext). When set,
  this is the value that's checked.
- **Fallback** — a bcrypt hash in `app_config.staff_pin_hash`. Used only
  when the `STAFF_PIN` secret is absent.

The on-screen keypad has 4 dots, so the PIN **must be exactly 4 digits**
(changing the length would also require editing `AdminPinOverlay.tsx` /
`KioskLockScreen.tsx` / `MatchResult.tsx`).

### Steps to change it

**1. Update the `STAFF_PIN` secret** (the one that's actually used)

- Supabase Dashboard → Edge Functions → `verify-pin` → **Manage secrets**
- Edit `STAFF_PIN` → enter the new 4-digit value → Save
- **Redeploy `verify-pin`** so the new value is picked up immediately
  (warm instances keep the old value until they're recycled).

**2. Update the DB fallback hash** (optional, keeps both paths in sync)

Supabase Dashboard → SQL Editor → run, with your new PIN:

```sql
INSERT INTO public.app_config (key, value)
VALUES ('staff_pin_hash',
        extensions.crypt('NEW_PIN', extensions.gen_salt('bf')))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**3. Clear any active lockout** (only if someone is currently locked out
after failed attempts)

```sql
DELETE FROM public.admin_access_log
WHERE created_at > now() - interval '15 minutes'
  AND success = false;
```

**4. Test** — open the AdminPinOverlay (6 taps on the logo) or `/manager`
and enter the new PIN.

> If you only do step 1, that's enough — the secret takes priority. Step 2
> just keeps the fallback consistent in case the secret is ever removed.

---

## Useful queries

```sql
-- Sessions with NULL discount_code that should have one
select id, email, created_at, email_sent
  from quiz_sessions
 where email_sent = true and discount_code is null;
-- Should return zero rows after migration 20260518000003.

-- Last 50 emails sent
select created_at, email, store_id, discount_code, match_percent
  from quiz_sessions
 where email_sent = true
 order by created_at desc
 limit 50;

-- PIN lockouts in the last day
select client_id, ip_address, attempts, locked_until
  from pin_lockouts
 where locked_until > now() - interval '1 day';
```
