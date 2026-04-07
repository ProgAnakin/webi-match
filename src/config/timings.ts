// Central timing configuration — change here to affect the whole app.

/** Quiz inactivity: ms without touch before showing the "Sei ancora qui?" warning */
export const INACTIVITY_TIMEOUT_MS = 45_000;

/** Warning overlay countdown duration before auto-resetting the quiz */
export const WARNING_DURATION_MS = 10_000;

/** Admin pages (Stats / Manager): ms idle before auto-logout */
export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
