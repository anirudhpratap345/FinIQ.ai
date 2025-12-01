"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface PulsingCTAProps {
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  size?: "default" | "large";
}

export default function PulsingCTA({ 
  href = "/finance-copilot", 
  onClick,
  children = "Get My Free Strategy",
  size = "large"
}: PulsingCTAProps) {
  const sizeClasses = size === "large" 
    ? "px-10 py-5 text-lg md:text-xl" 
    : "px-8 py-4 text-base";
  
  const ButtonContent = () => (
    <>
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 blur-xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 blur-lg"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      
      {/* Button surface */}
      <motion.div
        className={`relative ${sizeClasses} rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 bg-[length:200%_100%] font-bold text-white flex items-center gap-3 shadow-2xl shadow-blue-500/25`}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.5)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles className="h-5 w-5" />
        {children}
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </>
  );
  
  if (onClick) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        onClick={onClick}
        className="relative inline-flex cursor-pointer"
      >
        <ButtonContent />
      </motion.button>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      <Link href={href} className="relative inline-flex">
        <ButtonContent />
      </Link>
    </motion.div>
  );
}

