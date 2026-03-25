import { motion } from "framer-motion";

const orbs = [
  { size: 400, x: "5%", y: "10%", color: "hsl(27, 92%, 55%)", delay: 0, duration: 16 },
  { size: 350, x: "70%", y: "5%", color: "hsl(16, 100%, 50%)", delay: 1, duration: 20 },
  { size: 300, x: "55%", y: "65%", color: "hsl(27, 92%, 55%)", delay: 3, duration: 18 },
  { size: 280, x: "15%", y: "70%", color: "hsl(230, 65%, 50%)", delay: 0.5, duration: 22 },
  { size: 250, x: "85%", y: "45%", color: "hsl(16, 100%, 50%)", delay: 2, duration: 14 },
  { size: 200, x: "45%", y: "30%", color: "hsl(230, 65%, 45%)", delay: 4, duration: 19 },
  { size: 320, x: "30%", y: "90%", color: "hsl(27, 92%, 60%)", delay: 1.5, duration: 17 },
];

const particles = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  x: `${Math.random() * 100}%`,
  y: `${20 + Math.random() * 80}%`,
  size: 3 + Math.random() * 6,
  delay: Math.random() * 6,
  duration: 3 + Math.random() * 5,
}));

const shapes = [
  { type: "ring", x: "12%", y: "20%", size: 120, delay: 0 },
  { type: "ring", x: "78%", y: "60%", size: 90, delay: 1.5 },
  { type: "ring", x: "50%", y: "40%", size: 70, delay: 3 },
  { type: "ring", x: "88%", y: "15%", size: 50, delay: 0.5 },
  { type: "square", x: "68%", y: "18%", size: 45, delay: 1 },
  { type: "square", x: "22%", y: "55%", size: 35, delay: 2.5 },
  { type: "square", x: "42%", y: "75%", size: 28, delay: 4 },
  { type: "diamond", x: "48%", y: "88%", size: 36, delay: 1.2 },
  { type: "diamond", x: "92%", y: "32%", size: 28, delay: 3.5 },
  { type: "diamond", x: "8%", y: "42%", size: 22, delay: 0.8 },
  { type: "cross", x: "38%", y: "10%", size: 30, delay: 2 },
  { type: "cross", x: "6%", y: "48%", size: 24, delay: 0.3 },
  { type: "cross", x: "75%", y: "80%", size: 20, delay: 3.2 },
  { type: "cross", x: "58%", y: "52%", size: 18, delay: 1.8 },
];

const DiscoveryBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient orbs — bigger and brighter */}
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
            opacity: 0.25,
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

      {/* Floating particles — more and brighter */}
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
            opacity: [0, 0.7, 0],
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

      {/* Geometric shapes — more, bigger, more visible */}
      {shapes.map((shape, i) => (
        <motion.div
          key={`shape-${i}`}
          className="absolute"
          style={{ left: shape.x, top: shape.y }}
          animate={{
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
            y: [0, -20, 0],
          }}
          transition={{
            rotate: { duration: 15 + i * 2, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4 + i * 0.8, repeat: Infinity, ease: "easeInOut" },
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
              className="rounded-md border-2 border-primary"
              style={{ width: shape.size, height: shape.size }}
            />
          )}
          {shape.type === "diamond" && (
            <div
              className="rotate-45 border-2 border-primary"
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

      {/* Scan lines — two, more visible */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-primary"
        style={{ opacity: 0.12 }}
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-0 right-0 h-px bg-primary"
        style={{ opacity: 0.08 }}
        animate={{ top: ["105%", "-5%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear", delay: 3 }}
      />
    </div>
  );
};

export default DiscoveryBackground;
