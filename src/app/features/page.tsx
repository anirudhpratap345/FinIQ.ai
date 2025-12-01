'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ComparisonCarousel from '@/components/ComparisonCarousel';

interface Stats {
  totalStrategies: number;
  accuracyRating: number;
}

// Showcase data - real outputs from the system
const showcaseData = [
  {
    id: 'snycopy',
    title: 'AI Therapy Startup',
    subtitle: 'Mental Health + Insurance Tech',
    highlights: [
      'Hire ex-NIMHANS psychologists',
      '₹499/month insurance bundles',
      'RCI license compliance',
      'School partnership strategy',
    ],
    stage: 'Pre-Seed',
    raise: '$375K–$562K',
    priority: 'Get insurance panel credentialing in 90 days',
    color: 'from-purple-500/20 to-indigo-500/20',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'tensorstack',
    title: 'AI Infrastructure',
    subtitle: 'GPU Compute Platform',
    highlights: [
      'Lock H100 capacity at <$2/hr',
      'SOC 2 Type II in 6 months',
      'Multi-cloud failover Day 1',
      'Target inference at <$0.001/1K tokens',
    ],
    stage: 'Series A',
    raise: '$20M–$28M',
    priority: 'Secure CoreWeave/Lambda contracts',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'canyonclub',
    title: 'D2C Menswear',
    subtitle: 'Premium Chinos & Polos',
    highlights: [
      'Series A ready (high margins)',
      'Inventory financing NOW',
      'Lerer Hippeau, Forerunner targets',
      'Spring/Summer 2025 prep',
    ],
    stage: 'Series A',
    raise: '$1.2M–$1.8M',
    priority: 'Secure inventory financing before Q2',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
  },
];

// Feature list
const features = [
  {
    title: '7-Agent Pipeline',
    description: 'IdeaUnderstanding → IndustrySpecialist → FundingStage → RaiseAmount → InvestorType → Runway → Priorities',
    icon: '🔗',
  },
  {
    title: 'Industry-Specific Playbooks',
    description: '25+ niche verticals with hyper-specific advice: soft toys, therapy clinics, farmtech, defence, dating apps, quick commerce...',
    icon: '🎯',
  },
  {
    title: 'Real Investor Names',
    description: 'Not generic "VCs" — actual fund names that invest in your exact category right now.',
    icon: '💼',
  },
  {
    title: 'Multi-Provider LLM',
    description: 'Auto-failover across Groq, DeepSeek, OpenRouter, Gemini. Never fails, always fast.',
    icon: '⚡',
  },
  {
    title: 'Smart Caching',
    description: 'Redis + file fallback. Same input = instant results. 90% API cost reduction.',
    icon: '💾',
  },
  {
    title: 'No Login Required',
    description: '5 free runs. No email. No credit card. Just answers.',
    icon: '🔓',
  },
];

export default function FeaturesPage() {
  const [stats, setStats] = useState<Stats>({ totalStrategies: 1247, accuracyRating: 89 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Hero */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light text-white mb-6"
          >
            What FinIQ Delivers
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto"
          >
            Not generic advice. Hyper-specific playbooks for your exact niche — 
            the kind of intel you&apos;d get from a VC who&apos;s done 200+ deals in your vertical.
          </motion.p>
        </div>
      </section>

      {/* Comparison Carousel - Generic AI vs FinIQ */}
      <section className="py-16 px-6">
        <ComparisonCarousel />
      </section>

      {/* Real Output Showcase */}
      <section className="py-16 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-light text-white text-center mb-12"
          >
            Real Outputs. Real Startups.
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {showcaseData.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-[#111111] border ${item.borderColor} rounded-xl overflow-hidden`}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${item.color} px-6 py-4 border-b border-white/5`}>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.subtitle}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Highlights */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Industry Playbook</div>
                    <ul className="space-y-1.5">
                      {item.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="text-cyan-400">•</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stage & Raise */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div>
                      <div className="text-xs text-zinc-500">Stage</div>
                      <div className="text-white font-medium">{item.stage}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500">Raise</div>
                      <div className="text-emerald-400 font-medium">{item.raise}</div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="bg-[#1a1a1a] rounded-lg p-3 border-l-2 border-amber-500">
                    <div className="text-xs text-zinc-500 mb-1">Priority #1</div>
                    <div className="text-sm text-white">{item.priority}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-zinc-500 mt-12 text-sm"
          >
            {stats.totalStrategies.toLocaleString()}+ strategies generated · {stats.accuracyRating}% &quot;scary accurate&quot;
          </motion.p>
        </div>
      </section>

      {/* Features Grid - Under the Hood */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-light text-white text-center mb-12"
          >
            Under the Hood
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111111] border border-[#222222] rounded-xl p-6"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-light text-white mb-6"
          >
            Ready to see your playbook?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Link 
              href="/finance-copilot"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Get My Free Strategy
              <span className="text-lg">→</span>
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-sm mt-4"
          >
            No login. 5 free runs. Takes 30 seconds.
          </motion.p>
        </div>
      </section>
    </div>
  );
}
