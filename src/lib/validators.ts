// Pure validation helpers shared by the kiosk + manager UIs.
//
// ⚠ The Edge Function `supabase/functions/on-session-created` contains
// copies of these helpers (Deno can't import from `src/`). When you change
// anything here, update the Edge Function copy too. The unit tests in
// `src/__tests__/validators.test.ts` lock the expected behaviour for both.

/** kebab-case slug shape used for store_id values. */
export const STORE_ID_RE = /^[a-z0-9][a-z0-9-]{1,49}$/;

export function isValidStoreId(id: unknown): boolean {
  return typeof id === "string" && STORE_ID_RE.test(id);
}

/**
 * Extract the 11-char YouTube video ID from common URL formats:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/shorts/ID
 * - youtube.com/embed/ID
 * - youtube-nocookie.com/embed/ID
 */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
