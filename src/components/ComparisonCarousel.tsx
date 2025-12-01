"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Bot, Sparkles, X, Check } from "lucide-react";

const comparisons = [
  {
    chatgpt: {
      query: '"How much should my AI startup raise?"',
      response: `Based on your stage, most AI startups raise between $1-3M in their seed round. Consider factors like runway, team size, and market conditions. I'd recommend reaching out to angel investors and early-stage VCs.`,
    },
    finiq: {
      startup: "Canyon Club — AI-powered inventory for restaurants",
      stage: "Series A",
      amount: "$4M-$6M",
      investors: ["Restaurant Tech VCs", "Food & Bev Angels", "Strategic: Sysco Ventures"],
      priority: "Inventory prediction accuracy → 95%+ before scaling",
      runway: "18-22 months",
    },
  },
  {
    chatgpt: {
      query: '"What funding stage am I at?"',
      response: `It depends on various factors including your revenue, team size, and product maturity. Generally, if you have an MVP and some early customers, you might be at pre-seed or seed stage.`,
    },
    finiq: {
      startup: "ColdChain Bio — Radioactive drug logistics",
      stage: "Series A",
      amount: "$8M-$12M",
      investors: ["Life Science VCs", "DeepTech Funds", "Strategic: McKesson"],
      priority: "FDA compliance + -80°C fleet expansion",
      runway: "24-30 months",
    },
  },
  {
    chatgpt: {
      query: '"Who should I pitch to?"',
      response: `Look for investors who have experience in your industry. Check AngelList, Crunchbase, and LinkedIn for relevant VCs. Consider accelerators like Y Combinator or Techstars as well.`,
    },
    finiq: {
      startup: "Inferix — Decentralized GPU grid for AI training",
      stage: "Series A",
      amount: "$15M-$25M",
      investors: ["Infra VCs (a16z crypto)", "AI/ML Funds", "Strategic: NVIDIA Inception"],
      priority: "Multi-region cluster expansion + unit economics",
      runway: "18-24 months",
    },
  },
];

export default function ComparisonCarousel() {
  const [current, setCurrent] = useState(0);
  
  const next = () => setCurrent((c) => (c + 1) % comparisons.length);
  const prev = () => setCurrent((c) => (c - 1 + comparisons.length) % comparisons.length);
  
  const comparison = comparisons[current];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Generic AI vs. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">FinIQ.ai</span>
        </h3>
        <p className="text-gray-400">See the difference domain-aware analysis makes</p>
      </div>
      
      <div className="relative">
        {/* Navigation */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition hidden md:block"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition hidden md:block"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* ChatGPT Side */}
            <div className="relative rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 to-black/40 p-6 backdrop-blur-sm">
              <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-1.5">
                <X className="h-3 w-3" />
                Generic AI
              </div>
              
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="p-2 rounded-lg bg-white/5">
                  <Bot className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-gray-400 text-sm font-medium">ChatGPT / Claude / Gemini</span>
              </div>
              
              <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/5">
                <p className="text-gray-500 text-xs mb-1">Your prompt:</p>
                <p className="text-white text-sm italic">{comparison.chatgpt.query}</p>
              </div>
              
              <div className="text-gray-300 text-sm leading-relaxed">
                {comparison.chatgpt.response}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-red-400/80 text-xs">
                <X className="h-3.5 w-3.5" />
                Vague ranges, no specifics, generic advice
              </div>
            </div>
            
            {/* FinIQ Side */}
            <div className="relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-black/40 p-6 backdrop-blur-sm">
              <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                <Check className="h-3 w-3" />
                FinIQ.ai
              </div>
              
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{comparison.finiq.startup}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-gray-400 text-sm">Stage</span>
                  <span className="text-white font-semibold">{comparison.finiq.stage}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-gray-400 text-sm">Raise Amount</span>
                  <span className="text-emerald-400 font-semibold">{comparison.finiq.amount}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-gray-400 text-sm block mb-2">Target Investors</span>
                  <div className="flex flex-wrap gap-1.5">
                    {comparison.finiq.investors.map((inv) => (
                      <span key={inv} className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                        {inv}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-gray-400 text-sm">Priority</span>
                  <span className="text-yellow-400 text-xs text-right max-w-[60%]">{comparison.finiq.priority}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-emerald-400/80 text-xs">
                <Check className="h-3.5 w-3.5" />
                Domain-aware, specific, actionable
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {comparisons.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current 
                  ? "bg-blue-500 w-6" 
                  : "bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
        
        {/* Mobile nav */}
        <div className="flex justify-center gap-4 mt-4 md:hidden">
          <button onClick={prev} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

