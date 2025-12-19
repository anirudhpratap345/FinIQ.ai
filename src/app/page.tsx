"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import ComparisonCarousel from "@/components/ComparisonCarousel";
import AnimatedFlow from "@/components/AnimatedFlow";
import ShowcaseCards from "@/components/ShowcaseCards";
import HeroParticles from "@/components/HeroParticles";

export default function Home() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-[#0d1117] opacity-95" />
      
      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6">
        {/* Particle Background */}
        <HeroParticles className="overflow-hidden" />
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)"
          }}
        />
        
        {/* Dot Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center max-w-4xl mx-auto pt-32 pb-20"
        >
          {/* Heading Line 1: "Your AI" */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white font-extrabold leading-tight mb-2"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              letterSpacing: "-0.02em"
            }}
          >
            Your AI
          </motion.h1>

          {/* Heading Line 2: "VC Partner" with Gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 font-extrabold leading-tight mb-8"
            style={{
              fontSize: "clamp(3.5rem, 8vw, 7rem)",
              letterSpacing: "-0.02em",
              textShadow: "0 0 60px rgba(99, 102, 241, 0.4)"
            }}
          >
            VC Partner
          </motion.h1>
          
          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-zinc-300 mt-8 max-w-[600px] mx-auto leading-[1.7]"
          >
            Tells you exactly how much to raise,<br className="hidden md:block" />
            from whom, and what to fix first — in 30 seconds.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12"
          >
            <Link href="/finance-copilot">
              <button
                className={`group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 rounded-full text-white text-lg font-semibold shadow-[0_10px_40px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_50px_rgba(99,102,241,0.6)] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 w-full md:w-auto ${!prefersReducedMotion ? "animate-pulse-glow" : ""}`}
              >
                Get My Free Strategy
                <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </Link>
          </motion.div>

          {/* Floating 3D Cards */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-16">
            {/* Card 1: Series A */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="group w-full md:w-[180px] h-28 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center"
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px"
              }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="text-blue-400 font-semibold text-lg">Series A</div>
              <div className="text-zinc-400 text-sm mt-2">Focus Stage</div>
            </motion.div>

            {/* Card 2: $4-6M */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="group hidden md:flex w-[180px] h-28 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center"
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px"
              }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="text-indigo-400 font-semibold text-lg">$4-6M</div>
              <div className="text-zinc-400 text-sm mt-2">Raise Range</div>
            </motion.div>

            {/* Card 3: Top VCs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="group hidden md:flex w-[180px] h-28 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center"
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px"
              }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="text-purple-400 font-semibold text-lg">Top VCs</div>
              <div className="text-zinc-400 text-sm mt-2">Target Tier</div>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="mt-20 text-zinc-500 text-sm"
          >
            Built on Groq Llama 3.3 70B + DeepSeek-R1 • Used by founders from YC, a16z & Sequoia portfolios
          </motion.p>
        </motion.div>
      </section>

      {/* Comparison Carousel Section */}
      <section className="relative z-10 py-20 px-6">
        <ComparisonCarousel />
      </section>

      {/* How It Works - Animated Flow */}
      <section id="how-it-works" className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How it works
            </h3>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              No signup. No credit card. Just answers.
            </p>
          </motion.div>
          
          <AnimatedFlow />
        </div>
      </section>

      {/* Real Output Showcase */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Real outputs. Real startups.
            </h3>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              See what FinIQ generates for different industries — no cherry-picking.
            </p>
          </motion.div>
          
          <ShowcaseCards />
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Big Bold Statement */}
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              No login. 5 free runs.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Zero fluff.</span>
            </h2>
            
            {/* Secondary CTA */}
            <div className="mb-8">
              <Link href="/finance-copilot">
                <button className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full text-white text-lg font-medium shadow-2xl shadow-cyan-500/30 transition-all transform hover:scale-105">
                  Get My Free Strategy
                </button>
              </Link>
            </div>
            
          </motion.div>
        </div>
      </section>
    </div>
  );
}
