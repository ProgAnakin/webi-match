import { useCallback } from "react";

/**
 * Synthesizes a celebratory match sound using Web Audio API.
 * No audio file needed — generated programmatically.
 * Silently ignored if the browser doesn't support it.
 */
export function useMatchSound() {
  const play = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Rising arpeggio: C5 → E5 → G5 → C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const noteDuration = 0.12;
      const noteGap = 0.08;

      notes.forEach((freq, i) => {
        const startTime = ctx.currentTime + i * (noteDuration + noteGap);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        // Smooth envelope: quick attack, gentle release
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      });

      // Short chime tail after the arpeggio
      const tailStart = ctx.currentTime + notes.length * (noteDuration + noteGap);
      const tail = ctx.createOscillator();
      const tailGain = ctx.createGain();
      tail.connect(tailGain);
      tailGain.connect(ctx.destination);
      tail.type = "sine";
      tail.frequency.setValueAtTime(1046.5, tailStart);
      tail.frequency.exponentialRampToValueAtTime(880, tailStart + 0.3);
      tailGain.gain.setValueAtTime(0.12, tailStart);
      tailGain.gain.exponentialRampToValueAtTime(0.001, tailStart + 0.4);
      tail.start(tailStart);
      tail.stop(tailStart + 0.4);

      // Auto-close context after playback to free resources
      setTimeout(() => ctx.close(), (tailStart + 0.5) * 1000);
    } catch {
      // Silently ignore — unsupported browser or user gesture required
    }
  }, []);

  return { play };
}
