import { memo } from "react";

interface SwipeyLogoProps {
  /** Visual height in px (logo scales proportionally). */
  size?: number;
  /** Show the wordmark next to the monogram. */
  withWordmark?: boolean;
  className?: string;
}

// Inline SVG brand mark — replaces the legacy <img src="webidoo-logo.webp" />.
// The monogram is a stylised "S" formed by two interlocked curves with an
// electric-blue → cyan gradient, evoking the swipe gesture. Sits on a soft
// glow so it still reads on dark and slightly-lighter backgrounds.
export const SwipeyLogo = memo(({ size = 80, withWordmark = false, className = "" }: SwipeyLogoProps) => {
  const w = withWordmark ? size * 3.5 : size;
  return (
    <div
      className={`inline-flex items-center gap-3 ${className}`}
      style={{ height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="swipey-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%"  stopColor="hsl(217, 91%, 60%)" />
            <stop offset="60%" stopColor="hsl(202, 92%, 55%)" />
            <stop offset="100%" stopColor="hsl(188, 86%, 53%)" />
          </linearGradient>
          <filter id="swipey-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Stylised "S" — two interlocking swipe arcs */}
        <g filter="url(#swipey-glow)" stroke="url(#swipey-grad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M48 18 C 40 10, 22 10, 18 22 C 14 32, 26 34, 36 36 C 46 38, 50 42, 46 50 C 42 58, 24 58, 16 50" />
        </g>
      </svg>
      {withWordmark && (
        <span
          className="font-black tracking-tight leading-none"
          style={{
            fontSize: size * 0.62,
            background: "linear-gradient(135deg, hsl(0,0%,100%) 0%, hsl(202,80%,90%) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Swipey
        </span>
      )}
      {/* Reserve calculated width when wordmark is on, so flex sibling spacing stays predictable */}
      {withWordmark && <span style={{ display: "none", width: w }} />}
    </div>
  );
});

SwipeyLogo.displayName = "SwipeyLogo";
