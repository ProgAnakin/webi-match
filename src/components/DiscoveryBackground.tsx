import { motion } from "framer-motion";

// SVG line-art gadgets as path data
const gadgetPaths: { name: string; path: string; viewBox: string; }[] = [
  {
    // Massage gun
    name: "massage-gun",
    viewBox: "0 0 64 64",
    path: "M20 12h8a4 4 0 0 1 4 4v12h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-8v8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4zM28 28h12M32 8v4M32 52v4",
  },
  {
    // LED face mask
    name: "led-mask",
    viewBox: "0 0 64 64",
    path: "M16 24c0-8 6-16 16-16s16 8 16 16v4c0 10-6 20-16 24-10-4-16-14-16-24v-4zM24 24a2 2 0 1 0 4 0 2 2 0 0 0-4 0M36 24a2 2 0 1 0 4 0 2 2 0 0 0-4 0M26 36c3 3 9 3 12 0",
  },
  {
    // Portable blender
    name: "blender",
    viewBox: "0 0 64 64",
    path: "M22 8h20v4H22zM20 12h24l-2 36a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4L20 12zM26 20l4 8-4 8M38 20l-4 8 4 8M28 56h8v4H28z",
  },
  {
    // USB cable
    name: "usb-cable",
    viewBox: "0 0 64 64",
    path: "M24 8h16v12H24zM28 20v4M36 20v4M32 24v16M24 40h16v16H24zM28 44v4M36 44v4M32 12h0M28 48h8",
  },
  {
    // Speaker / soundbox
    name: "speaker",
    viewBox: "0 0 64 64",
    path: "M18 8h28a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4zM32 20a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM32 40a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM32 14h0",
  },
  {
    // Neck massager
    name: "neck-massager",
    viewBox: "0 0 64 64",
    path: "M12 32c0-12 8-20 20-20s20 8 20 20M12 32v8a4 4 0 0 0 4 4h4M52 32v8a4 4 0 0 1-4 4h-4M20 36a2 2 0 1 0 4 0 2 2 0 0 0-4 0M40 36a2 2 0 1 0 4 0 2 2 0 0 0-4 0M30 36a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
  },
  {
    // Smartwatch
    name: "smartwatch",
    viewBox: "0 0 64 64",
    path: "M22 16h20a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4zM26 8h12v8H26zM26 48h12v8H26zM32 24v8l4 4M48 30h4M12 30h4",
  },
  {
    // Headphones
    name: "headphones",
    viewBox: "0 0 64 64",
    path: "M12 36V28a20 20 0 0 1 40 0v8M12 32v12a4 4 0 0 0 4 4h4V28h-4a4 4 0 0 0-4 4zM52 32v12a4 4 0 0 1-4 4h-4V28h4a4 4 0 0 1 4 4z",
  },
  {
    // Earbuds
    name: "earbuds",
    viewBox: "0 0 64 64",
    path: "M20 20a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM44 20a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM20 36v12M44 36v12M16 48h8M40 48h8",
  },
  {
    // Camera / action cam
    name: "action-cam",
    viewBox: "0 0 64 64",
    path: "M14 18h36a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V22a4 4 0 0 1 4-4zM32 26a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM20 14h8l4 4M44 24h4",
  },
  {
    // Gamepad
    name: "gamepad",
    viewBox: "0 0 64 64",
    path: "M8 28a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v8a12 12 0 0 1-12 12h-4l-4 4h-8l-4-4h-4A12 12 0 0 1 8 36v-8zM20 28v8M16 32h8M40 28h0M44 32h0M48 28h0M44 24h0",
  },
  {
    // Power bank
    name: "powerbank",
    viewBox: "0 0 64 64",
    path: "M20 8h24a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4zM28 16h8M28 22h8M28 28h4M32 48a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  },
];

const floatingGadgets = [
  { gadget: 0, x: "8%", y: "12%", size: 52, delay: 0 },
  { gadget: 1, x: "82%", y: "8%", size: 58, delay: 1.2 },
  { gadget: 2, x: "72%", y: "68%", size: 48, delay: 2.5 },
  { gadget: 3, x: "18%", y: "72%", size: 40, delay: 0.8 },
  { gadget: 4, x: "55%", y: "85%", size: 54, delay: 3.2 },
  { gadget: 5, x: "90%", y: "40%", size: 50, delay: 1.8 },
  { gadget: 6, x: "5%", y: "45%", size: 46, delay: 0.4 },
  { gadget: 7, x: "40%", y: "5%", size: 56, delay: 2.0 },
  { gadget: 8, x: "30%", y: "88%", size: 42, delay: 3.8 },
  { gadget: 9, x: "65%", y: "22%", size: 50, delay: 1.5 },
  { gadget: 10, x: "48%", y: "50%", size: 44, delay: 4.0 },
  { gadget: 11, x: "25%", y: "30%", size: 38, delay: 2.8 },
  { gadget: 7, x: "85%", y: "78%", size: 46, delay: 0.6 },
  { gadget: 0, x: "38%", y: "38%", size: 36, delay: 3.5 },
  { gadget: 4, x: "15%", y: "90%", size: 44, delay: 1.0 },
  { gadget: 9, x: "92%", y: "58%", size: 40, delay: 2.2 },
];

const orbs = [
  { size: 400, x: "5%", y: "10%", color: "hsl(27, 92%, 55%)", delay: 0, duration: 16 },
  { size: 350, x: "70%", y: "5%", color: "hsl(16, 100%, 50%)", delay: 1, duration: 20 },
  { size: 300, x: "55%", y: "65%", color: "hsl(27, 92%, 55%)", delay: 3, duration: 18 },
  { size: 280, x: "15%", y: "70%", color: "hsl(230, 65%, 50%)", delay: 0.5, duration: 22 },
  { size: 250, x: "85%", y: "45%", color: "hsl(16, 100%, 50%)", delay: 2, duration: 14 },
  { size: 320, x: "30%", y: "90%", color: "hsl(27, 92%, 60%)", delay: 1.5, duration: 17 },
];

const particles = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${20 + Math.random() * 80}%`,
  size: 2 + Math.random() * 5,
  delay: Math.random() * 6,
  duration: 3 + Math.random() * 5,
}));

const DiscoveryBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(50px)",
            opacity: 0.22,
          }}
          animate={{
            x: [0, 50, -40, 30, 0],
            y: [0, -40, 30, -50, 0],
            scale: [1, 1.3, 0.85, 1.15, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Floating gadget line-art icons */}
      {floatingGadgets.map((item, i) => {
        const g = gadgetPaths[item.gadget];
        return (
          <motion.div
            key={`gadget-${i}`}
            className="absolute"
            style={{ left: item.x, top: item.y }}
            animate={{
              rotate: [0, 8, -8, 0],
              y: [0, -18, 0],
              opacity: [0.12, 0.28, 0.12],
            }}
            transition={{
              rotate: { duration: 8 + i * 1.5, repeat: Infinity, ease: "easeInOut" },
              y: { duration: 5 + i * 0.7, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
              delay: item.delay,
            }}
          >
            <svg
              width={item.size}
              height={item.size}
              viewBox={g.viewBox}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={g.path}
                stroke="hsl(27, 92%, 55%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        );
      })}

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={`particle-${p.id}`}
          className="absolute rounded-full bg-primary"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -80, -160],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Scan lines */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-primary"
        style={{ opacity: 0.1 }}
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-0 right-0 h-px bg-primary"
        style={{ opacity: 0.06 }}
        animate={{ top: ["105%", "-5%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear", delay: 3 }}
      />
    </div>
  );
};

export default DiscoveryBackground;
