// Per-device pseudonymous ID for kiosk attempts.
// Rotated daily to limit long-term cross-session tracking on shared iPads.

const ID_KEY  = "wb_client_id";
const TS_KEY  = "wb_client_id_rotated";
const DAY_MS  = 86_400_000;

export function getClientId(): string {
  const lastTs = Number(localStorage.getItem(TS_KEY) ?? 0);
  if (!localStorage.getItem(ID_KEY) || Date.now() - lastTs > DAY_MS) {
    localStorage.setItem(ID_KEY, crypto.randomUUID());
    localStorage.setItem(TS_KEY, String(Date.now()));
  }
  return localStorage.getItem(ID_KEY)!;
}
