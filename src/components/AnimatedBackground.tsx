"use client";

import { motion } from "framer-motion";

const vcLogos = [
  "Y Combinator",
  "a16z",
  "Sequoia",
  "Accel",
  "Lightspeed",
  "Index",
  "Founders Fund",
  "Greylock",
  "Benchmark",
  "NEA",
  "Khosla",
  "General Catalyst",
];

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Main gradient background */}
      <motion.div
        className="absolute inset-0 animated-gradient opacity-10"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Perspective grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '120px 120px',
          }}
        />
      </div>
      
      {/* Floating VC logos */}
      <div className="absolute inset-0">
        {vcLogos.map((logo, i) => (
          <motion.div
            key={logo}
            className="absolute text-white/[0.04] font-semibold text-sm tracking-wide select-none"
            style={{
              left: `${10 + (i % 4) * 25}%`,
              top: `${15 + Math.floor(i / 4) * 30}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.06, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8 + (i % 3) * 2,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          >
            {logo}
          </motion.div>
        ))}
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 floating-particles" />
      
      {/* Animated orbs with subtle blue tint */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-900/5 to-indigo-900/3 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -25, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-3/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-indigo-900/5 to-purple-900/3 rounded-full blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 0.95, 1],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-gradient-to-r from-cyan-900/5 to-blue-900/3 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Scan line effect */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"
        animate={{
          top: ["0%", "100%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
