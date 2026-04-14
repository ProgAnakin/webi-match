import { memo } from "react";

const PRODUCTS = {
  smartwatch: "M17 6h14v5H17z M17 37h14v5H17z M14 11h20a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z M24 20v5l4 2",
  massageGun: "M15 8h8a4 4 0 0 1 4 4v9h8a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-8v6a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z M27 21h12",
  ledMask:    "M9 22c0-9 7-16 15-16s15 7 15 16v4c0 10-6 17-15 18-9-1-15-8-15-18v-4z M17 22a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z M26 22a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z M20 33c2 2 6 2 8 0 M11 18l-4-6 M37 18l4-6",
  headphones: "M9 26V19a15 15 0 0 1 30 0v7 M9 22v12a4 4 0 0 0 4 4h2V22H9z M39 22v16h-2a4 4 0 0 1-4-4V22h6z",
  powerbank:  "M17 4h14a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z M21 13h6 M21 19h6 M21 25h4 M24 35a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M21 1h6v3h-6z",
  bigSpeaker: "M8 7h32a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4z M24 14a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M24 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M8 36a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
  miniSpeaker:"M14 12h20a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z M24 17a7 7 0 1 0 0 14 7 7 0 0 0 0-17z M24 21a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M8 18v12 M40 18v12 M19 6l-4 6 M29 6l4 6",
  projector:  "M6 17h30a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4z M36 21v6l10-4-10-2v0z M12 21a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M20 22h10 M20 26h8 M14 11l-2-7 M20 11v-7 M28 11l2-7 M14 37l-2 7 M28 37l2 7",
  airtag:     "M24 6a18 18 0 1 0 0 36A18 18 0 0 0 24 6z M24 14a10 10 0 1 0 0 20A10 10 0 0 0 24 14z M24 20a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M24 6v4 M24 38v4 M6 24h4 M38 24h4",
} as const;
type ProductKey = keyof typeof PRODUCTS;

const ICONS: { x: number; dur: number; delay: string; product: ProductKey; size: number }[] = [
  { x:  4, dur: 12, delay:  "-2s", product: "headphones",  size: 40 },
  { x: 12, dur: 15, delay:  "-8s", product: "airtag",      size: 34 },
  { x: 20, dur: 11, delay:  "-4s", product: "smartwatch",  size: 42 },
  { x: 28, dur: 13, delay: "-11s", product: "massageGun",  size: 36 },
  { x: 36, dur: 14, delay:  "-6s", product: "miniSpeaker", size: 44 },
  { x: 44, dur: 10, delay:  "-1s", product: "bigSpeaker",  size: 38 },
  { x: 52, dur: 16, delay: "-13s", product: "ledMask",     size: 46 },
  { x: 60, dur: 12, delay:  "-3s", product: "projector",   size: 40 },
  { x: 68, dur: 11, delay:  "-9s", product: "powerbank",   size: 36 },
  { x: 76, dur: 14, delay:  "-5s", product: "airtag",      size: 34 },
  { x: 84, dur: 13, delay:  "-7s", product: "headphones",  size: 42 },
  { x: 92, dur: 10, delay:  "-2s", product: "smartwatch",  size: 38 },
  { x:  8, dur: 13, delay: "-10s", product: "projector",   size: 36 },
  { x: 16, dur: 11, delay:  "-3s", product: "bigSpeaker",  size: 44 },
  { x: 24, dur: 15, delay:  "-7s", product: "powerbank",   size: 38 },
  { x: 32, dur: 12, delay:  "-5s", product: "ledMask",     size: 40 },
  { x: 48, dur: 14, delay: "-12s", product: "airtag",      size: 32 },
  { x: 56, dur: 10, delay:  "-4s", product: "massageGun",  size: 46 },
  { x: 72, dur: 16, delay:  "-9s", product: "miniSpeaker", size: 36 },
  { x: 88, dur: 11, delay:  "-6s", product: "smartwatch",  size: 42 },
];

const ORANGE = "hsla(27,92%,68%,1)";

export const AttractBackground = memo(() => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>

    {/* Deep space gradient */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 120% 80% at 50% 40%, hsl(225,50%,11%) 0%, hsl(225,60%,6%) 100%)",
    }} />

    {/* Tech grid */}
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: [
        "linear-gradient(hsla(230,60%,70%,0.06) 1px, transparent 1px)",
        "linear-gradient(90deg, hsla(230,60%,70%,0.06) 1px, transparent 1px)",
      ].join(","),
      backgroundSize: "72px 72px",
      animation: "at-grid-pulse 5s ease-in-out infinite",
      willChange: "opacity",
    }} />

    {/* Vivid ambient orbs */}
    <div style={{ position:"absolute", left:"-12%", top:"-10%", width:"max(520px,42vw)", height:"max(520px,42vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(27,92%,55%,0.9) 0%,transparent 70%)", filter:"blur(max(80px,7vw))", opacity:0.25, animation:"at-orb-a 18s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", right:"-14%", top:"5%", width:"max(460px,36vw)", height:"max(460px,36vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(16,100%,50%,0.9) 0%,transparent 70%)", filter:"blur(max(90px,7vw))", opacity:0.20, animation:"at-orb-b 22s ease-in-out infinite", willChange:"transform" }} />
    <div style={{ position:"absolute", left:"30%", bottom:"-8%", width:"max(380px,32vw)", height:"max(380px,32vw)", borderRadius:"50%", background:"radial-gradient(circle,hsla(27,92%,60%,0.9) 0%,transparent 70%)", filter:"blur(max(85px,7vw))", opacity:0.18, animation:"at-orb-c 20s ease-in-out infinite", willChange:"transform" }} />

    {/* Product icons floating upward */}
    {ICONS.map((icon, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${icon.x}%`,
          bottom: "0px",
          animation: `at-float-up ${icon.dur}s ease-in-out ${icon.delay} infinite`,
          willChange: "opacity, transform",
        }}
      >
        <svg width={icon.size} height={icon.size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d={PRODUCTS[icon.product]} stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ))}

    {/* Vignette */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, hsl(225,60%,5%) 100%)",
    }} />
  </div>
));
