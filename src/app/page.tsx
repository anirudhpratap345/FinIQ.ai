"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";
import ComparisonCarousel from "@/components/ComparisonCarousel";
import AnimatedFlow from "@/components/AnimatedFlow";
import ShowcaseCards from "@/components/ShowcaseCards";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-[#0d1117] opacity-95" />
      
      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6">
        <div className="text-center max-w-4xl mx-auto pt-32 pb-20">
          <h1 className="text-5xl md:text-6xl font-light text-white leading-tight">
            Your AI VC Partner
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-300 mt-8 leading-relaxed">
            Tells you exactly how much to raise,<br className="hidden md:block" />
            from whom, and what to fix first — in 30 seconds.
          </p>

          <div className="mt-12">
            <Link href="/finance-copilot">
              <button className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full text-white text-lg font-medium shadow-2xl shadow-cyan-500/30 transition-all transform hover:scale-105">
                Get My Free Strategy
              </button>
            </Link>
          </div>

          <p className="mt-20 text-zinc-500 text-sm">
            Built on Groq Llama 3.3 70B + DeepSeek-R1 • Used by founders from YC, a16z & Sequoia portfolios
          </p>
        </div>
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
