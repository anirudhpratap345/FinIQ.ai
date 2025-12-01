"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import HowItWorksModal from "@/components/HowItWorksModal";
import LiveCounters from "@/components/LiveCounters";
import ComparisonCarousel from "@/components/ComparisonCarousel";
import AnimatedFlow from "@/components/AnimatedFlow";
import PulsingCTA from "@/components/PulsingCTA";
import ShowcaseCards from "@/components/ShowcaseCards";
import { Play } from "lucide-react";

export default function Home() {
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-[#0d1117] opacity-95" />
      
      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-28 pb-16">
        <div className="text-center max-w-5xl mx-auto">
          {/* Live Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 mb-10"
          >
            <motion.div 
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-400 rounded-full"
            />
            <span className="text-sm text-emerald-400 font-medium">Live — 1,247+ founders this week</span>
          </motion.div>
          
          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
          >
            Your AI VC Partner
          </motion.h1>
          
          {/* Subheadline - Benefit */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed"
          >
            Tells you exactly how much to raise, from whom,<br className="hidden md:block" />
            and what to fix first — <span className="text-white font-semibold">in 30 seconds.</span>
          </motion.p>
          
          {/* Story Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-base text-gray-500 mb-12 max-w-2xl mx-auto italic"
          >
            &quot;I got tired of generic $1-2M Seed advice.<br />
            So I built the VC that never sleeps.&quot; — <span className="text-gray-400 not-italic">21yo indie from India</span>
          </motion.p>
          
          {/* Giant Pulsing CTA */}
          <div className="mb-10">
            <PulsingCTA href="/finance-copilot" size="large">
              Get My Free Strategy
            </PulsingCTA>
          </div>
          
          {/* Watch Demo Link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            onClick={() => setHowOpen(true)}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-12"
          >
            <Play className="h-4 w-4" />
            Watch 30-second demo
          </motion.button>
          
          {/* Live Trust Counters */}
          <LiveCounters />
        </div>
      </section>

      {/* Comparison Carousel Section */}
      <section id="features" className="relative z-10 py-20 px-6">
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
              <PulsingCTA href="/finance-copilot" size="large">
                Get My Free Strategy
              </PulsingCTA>
            </div>
            
          </motion.div>
        </div>
      </section>

      <HowItWorksModal open={howOpen} onClose={() => setHowOpen(false)} />
    </div>
  );
}
