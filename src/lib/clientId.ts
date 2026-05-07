const ID_KEY = "wb_client_id";
const TS_KEY = "wb_client_id_rotated";
const DAY_MS = 86_400_000;

// Cached ephemeral fallback when localStorage is unavailable (Safari Private,
// blocked storage). Lives only for the page lifetime, which is fine — the PIN
// lockout still works via UA + IP server-side.
let ephemeralId: string | null = null;

function newId(): string {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Returns a device-scoped ID that rotates daily — limits long-term tracking on shared kiosks. */
export function getClientId(): string {
  try {
    const lastTs = Number(localStorage.getItem(TS_KEY) ?? 0);
    if (!localStorage.getItem(ID_KEY) || Date.now() - lastTs > DAY_MS) {
      localStorage.setItem(ID_KEY, newId());
      localStorage.setItem(TS_KEY, String(Date.now()));
    }
    return localStorage.getItem(ID_KEY)!;
  } catch {
    if (!ephemeralId) ephemeralId = newId();
    return ephemeralId;
  }
}
