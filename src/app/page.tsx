"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Target, Clock, FileText, Github, Database, Brain, Play, ArrowRight } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import GlassCard from "@/components/GlassCard";
import AnimatedButton from "@/components/AnimatedButton";
import HowItWorksModal from "@/components/HowItWorksModal";

export default function Home() {
  const [howOpen, setHowOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <div className="absolute inset-0 bg-[#0d1117] opacity-95" />
      
      {/* Note: Global Navbar is provided by layout.tsx (fixed). */}

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-28 pb-20">
        <div className="text-center max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-subtle border border-white/20 mb-12"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
            />
            <span className="text-sm text-white/90 font-medium">FinIQ.ai is an AI tool for funding strategy</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
          >
            FinIQ.ai funding strategy
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Generate a structured funding strategy with recommended stage, raise amount, investor types, runway, and budget allocation.
          </motion.p>
          
          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <AnimatedButton 
              variant="secondary" 
              size="lg" 
              glow={false}
              delay={0.9}
              className="btn-primary-light rounded-full text-black"
              onClick={() => { window.location.href = '/finance-copilot'; }}
            >
              Open FinIQ.ai
              <ArrowRight className="h-5 w-5" />
            </AnimatedButton>
            <AnimatedButton 
              variant="outline" 
              size="lg" 
              delay={1.0}
              onClick={()=>setHowOpen(true)}
            >
              <Play className="h-5 w-5" />
              How it works
            </AnimatedButton>
          </motion.div>
          
          {/* Finance Overview Card (replaces old blueprint input) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="max-w-4xl mx-auto"
          >
            <GlassCard variant="strong" glow="purple" delay={1.2}>
              <div className="text-left mb-6">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-3">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 glow-blue"
                  >
                    <Brain className="h-5 w-5 text-white" />
                  </motion.div>
                  What FinIQ.ai does
                </h3>
                <p className="text-gray-400 text-sm">
                  FinIQ.ai takes basic startup inputs and returns a concise funding blueprint:
                </p>
              </div>
              <div className="space-y-6">
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-start gap-2"><span className="text-white">•</span> Recommended funding stage (Pre‑seed to Series A+)</li>
                  <li className="flex items-start gap-2"><span className="text-white">•</span> Suggested raise amount with a min–max range</li>
                  <li className="flex items-start gap-2"><span className="text-white">•</span> Investor types to target (angels, funds, accelerators)</li>
                  <li className="flex items-start gap-2"><span className="text-white">•</span> Runway estimate based on burn and target raise</li>
                  <li className="flex items-start gap-2"><span className="text-white">•</span> High‑level budget split across team, product, and GTM</li>
                </ul>
                <div className="pt-4">
                  <AnimatedButton 
                    onClick={() => { window.location.href = '/finance-copilot'; }}
                    variant="primary"
                    size="lg"
                    glow={true}
                    className="w-full"
                  >
                    Open FinIQ.ai
                    <ArrowRight className="h-5 w-5" />
                  </AnimatedButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-6 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl font-bold text-white mb-4">
              What it generates
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              FinIQ.ai focuses on a small set of concrete funding outputs.
            </p>
          </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Target,
              title: "Funding stage",
              description: "Recommended funding stage from pre‑seed to Series A+ based on your inputs.",
              gradient: "from-blue-600 to-blue-800",
              glow: "blue",
              delay: 0.1
            },
            {
              icon: FileText,
              title: "Raise amount",
              description: "Suggested amount to raise, with an approximate min–max range.",
              gradient: "from-slate-600 to-slate-800",
              glow: "blue",
              delay: 0.2
            },
            {
              icon: Clock,
              title: "Runway",
              description: "Estimated runway given your burn and the recommended raise.",
              gradient: "from-indigo-600 to-indigo-800",
              glow: "purple",
              delay: 0.3
            },
            {
              icon: Github,
              title: "Investor focus",
              description: "Priority investor types (angels, micro‑VCs, funds, accelerators).",
              gradient: "from-blue-700 to-blue-900",
              glow: "pink",
              delay: 0.4
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -12,
                transition: { duration: 0.3 }
              }}
            >
              <GlassCard 
                variant="default" 
                glow={feature.glow as any}
                hover={true}
                delay={feature.delay}
                className="h-full"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`icon-circle bg-gradient-to-r ${feature.gradient} mb-4 glow-${feature.glow}`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </motion.div>
                <h4 className="text-lg font-semibold text-white mb-3">{feature.title}</h4>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack Preview */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl font-bold text-white mb-4">
              How it works
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              FinIQ.ai uses a small set of agents to turn your inputs into a funding blueprint.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Brain,
                title: "1. Describe your startup",
                description: "Enter basic information about your product, traction, team, and goals.",
                gradient: "from-blue-600 to-blue-800",
                delay: 0.1
              },
              {
                icon: Database,
                title: "2. Multi‑agent analysis",
                description: "FinIQ.ai runs a structured pipeline of agents over your inputs.",
                gradient: "from-slate-600 to-slate-800",
                delay: 0.2
              },
              {
                icon: Zap,
                title: "3. Funding blueprint",
                description: "You get a concise strategy with stage, raise, investors, runway, and allocation.",
                gradient: "from-indigo-600 to-indigo-800",
                delay: 0.3
              }
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: tech.delay }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <GlassCard variant="default" delay={tech.delay} className="h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      transition={{ duration: 0.3 }}
                      className={`h-12 w-12 bg-gradient-to-r ${tech.gradient} rounded-xl flex items-center justify-center glow-${tech.gradient.split(' ')[1].split('-')[1]}`}
                    >
                      <tech.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{tech.title}</h4>
                      <p className="text-gray-400 text-sm">{tech.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorksModal open={howOpen} onClose={()=>setHowOpen(false)} />

      {/* Footer is included in RootLayout */}
    </div>
  );
}
