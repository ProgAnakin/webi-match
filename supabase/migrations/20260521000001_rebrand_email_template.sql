-- Rebrand the customer-facing email identity from the developer's personal
-- name to the company brand. Only touches rows still on the old default —
-- a manager's own edits are preserved.
UPDATE public.email_template
SET sender_name       = 'Suaipe',
    footer_store_name = 'Suaipe',
    updated_at        = now()
WHERE sender_name = 'Costanzo Annichini'
   OR footer_store_name IN ('Costanzo Annichini', 'COSTANZO ANNICHINI');
