import { memo } from "react";
import logoSrc from "@/assets/swipey-logo.png";

interface SwipeyLogoProps {
  /** Rendered size in px (square — height === width). */
  size?: number;
  /** When true, renders the "Swipey" wordmark next to the monogram. */
  withWordmark?: boolean;
  className?: string;
}

// Official Swipey brand mark — glossy 3D "S" in electric-blue, on a
// transparent background, supplied by the brand owner as a 512×512 PNG
// (src/assets/swipey-logo.png, already cropped to its visible bbox).
// The asset carries its own highlights and depth, so we just render the
// image; no SVG glow is applied to avoid muddying the gloss.
export const SwipeyLogo = memo(({ size = 80, withWordmark = false, className = "" }: SwipeyLogoProps) => (
  <div
    className={`inline-flex items-center gap-3 ${className}`}
    style={{ height: size }}
  >
    <img
      src={logoSrc}
      alt="Swipey"
      width={size}
      height={size}
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        // Subtle ambient halo behind the gloss so the mark reads on either
        // the kiosk's deep-navy panels or slightly lighter surfaces.
        filter: "drop-shadow(0 0 24px hsla(217, 91%, 60%, 0.35))",
        userSelect: "none",
        // Prevents iOS Safari from showing the long-press image menu.
        WebkitTouchCallout: "none",
      }}
    />
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
  </div>
));

SwipeyLogo.displayName = "SwipeyLogo";
