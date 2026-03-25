import { motion } from "framer-motion";

const orbs = [
  { size: 300, x: "10%", y: "15%", color: "hsl(27, 92%, 55%)", delay: 0, duration: 18 },
  { size: 200, x: "75%", y: "10%", color: "hsl(16, 100%, 50%)", delay: 2, duration: 22 },
  { size: 250, x: "60%", y: "70%", color: "hsl(27, 92%, 55%)", delay: 4, duration: 20 },
  { size: 180, x: "20%", y: "75%", color: "hsl(230, 65%, 45%)", delay: 1, duration: 25 },
  { size: 150, x: "85%", y: "50%", color: "hsl(16, 100%, 50%)", delay: 3, duration: 16 },
];

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 4,
  delay: Math.random() * 5,
  duration: 4 + Math.random() * 6,
}));

const shapes = [
  { type: "ring", x: "15%", y: "25%", size: 80, delay: 0 },
  { type: "ring", x: "80%", y: "65%", size: 60, delay: 2 },
  { type: "square", x: "70%", y: "20%", size: 30, delay: 1 },
  { type: "square", x: "25%", y: "60%", size: 20, delay: 3 },
  { type: "diamond", x: "50%", y: "85%", size: 24, delay: 1.5 },
  { type: "diamond", x: "90%", y: "35%", size: 18, delay: 4 },
  { type: "cross", x: "40%", y: "12%", size: 22, delay: 2.5 },
  { type: "cross", x: "8%", y: "50%", size: 16, delay: 0.5 },
];

const DiscoveryBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient orbs with blur */}
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
            filter: "blur(60px)",
            opacity: 0.15,
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -30, 20, -40, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

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
            opacity: [0, 0.4, 0],
            y: [0, -60, -120],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Geometric shapes */}
      {shapes.map((shape, i) => (
        <motion.div
          key={`shape-${i}`}
          className="absolute"
          style={{ left: shape.x, top: shape.y }}
          animate={{
            rotate: [0, 360],
            opacity: [0.06, 0.15, 0.06],
            y: [0, -15, 0],
          }}
          transition={{
            rotate: { duration: 20 + i * 3, repeat: Infinity, ease: "linear" },
            opacity: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut" },
            delay: shape.delay,
          }}
        >
          {shape.type === "ring" && (
            <div
              className="rounded-full border-2 border-primary"
              style={{ width: shape.size, height: shape.size }}
            />
          )}
          {shape.type === "square" && (
            <div
              className="rounded-md border border-primary"
              style={{ width: shape.size, height: shape.size }}
            />
          )}
          {shape.type === "diamond" && (
            <div
              className="rotate-45 border border-primary"
              style={{ width: shape.size, height: shape.size }}
            />
          )}
          {shape.type === "cross" && (
            <div className="relative" style={{ width: shape.size, height: shape.size }}>
              <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-primary" />
              <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-primary" />
            </div>
          )}
        </motion.div>
      ))}

      {/* Subtle scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-primary"
        style={{ opacity: 0.08 }}
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export default DiscoveryBackground;
