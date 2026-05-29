import { useEffect, useRef, useState } from "react";

// Drives the 1 Hz visible countdown for a server-enforced lockout
// (PIN brute-force, login rate limit, etc.). The lockout itself is enforced
// server-side — this hook only animates the remaining-seconds badge in the UI.
//
// Call setLockedSeconds(n) when the server returns a non-zero `locked_seconds`;
// the hook decrements it once a second and clears at zero.
export function useLockoutCountdown() {
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lockedSeconds <= 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setLockedSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lockedSeconds]);

  return {
    lockedSeconds,
    isLocked: lockedSeconds > 0,
    setLockedSeconds,
  };
}
