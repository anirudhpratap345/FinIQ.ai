"use client";

import { motion } from "framer-motion";

interface ShowcaseCard {
  name: string;
  category: string;
  description: string;
  stage: string;
  amount: string;
  investors: string;
  priority: string;
  runway: string;
  insight?: string;
  generatedTime: string;
}

const showcaseData: ShowcaseCard[] = [
  {
    name: "ColdChain Bio",
    category: "Radiopharma Logistics",
    description: "Radioactive cancer drugs at –80°C | Stanford pilot | $28K MRR",
    stage: "Seed (top-quartile)",
    amount: "$2.9M – $3.7M",
    investors: "Primary → OrbiMed, RA Capital, Deerfield\nSecondary → Thermo Fisher Ventures, Breakthrough Energy",
    priority: "Hire Chief Quality Officer (FDA/GMP) — contract blocker",
    runway: "17-21 months at $162-198K burn",
    generatedTime: "4.1s"
  },
  {
    name: "Canyon Club",
    category: "D2C Menswear",
    description: "Premium men's chinos & polos | Portugal-made | $94K MRR | 48% MoM",
    stage: "Series A ready (high gross margin + repeat rate)",
    amount: "$1.2M – $1.8M (user goal $1.5M = perfect)",
    investors: "Lerer Hippeau, Forerunner, Greycroft, ex-Bonobos angels",
    priority: "Secure Spring/Summer inventory financing NOW",
    runway: "15-20 months at $60-90K burn",
    generatedTime: "3.7s"
  },
  {
    name: "AsyncTeam",
    category: "Remote Team SaaS",
    description: "AI meeting notes + async updates | $23K MRR | 31% MoM | 180 paying teams",
    stage: "Pre-Seed → Seed bridge",
    amount: "$750K – $1.1M",
    investors: "Tiny Seed, Calm Fund, Niche SaaS angels (Jason Lemkin, Rob Walling)",
    priority: "Hire first full-time salesperson before more marketing spend",
    runway: "22-28 months at $31K burn",
    insight: "Bootstrap-friendly → raise only for sales acceleration",
    generatedTime: "3.4s"
  }
];

export default function ShowcaseCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {showcaseData.map((card, index) => (
        <motion.div
          key={card.name}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.15 }}
          viewport={{ once: true }}
          className="relative group"
        >
          {/* Glow effect on hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
          
          {/* Card */}
          <div className="relative bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden">
            {/* Header Tab */}
            <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2.5">
              <span className="text-cyan-400 text-sm font-medium">
                {card.name} ({card.category})
              </span>
            </div>
            
            {/* Content */}
            <div className="p-5 font-mono text-sm space-y-4">
              {/* Startup Info */}
              <div>
                <span className="text-gray-500">→ </span>
                <span className="text-white font-semibold">{card.name}</span>
                <div className="text-gray-300 mt-1">
                  {card.description.split(' | ').map((part, i) => (
                    <span key={i}>
                      {i > 0 && <span className="text-gray-600"> | </span>}
                      {part.includes('$') || part.includes('%') ? (
                        <span className="text-cyan-400">{part}</span>
                      ) : (
                        <span>{part}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Funding Stage */}
              <div>
                <div className="text-cyan-500/80 text-xs uppercase tracking-wider mb-1">Funding Stage</div>
                <div className="text-white">{card.stage}</div>
              </div>
              
              {/* Raise Amount */}
              <div>
                <div className="text-cyan-500/80 text-xs uppercase tracking-wider mb-1">Raise Amount</div>
                <div className="text-white">{card.amount}</div>
              </div>
              
              {/* Top Investors */}
              <div>
                <div className="text-cyan-500/80 text-xs uppercase tracking-wider mb-1">Top Investors</div>
                <div className="text-white whitespace-pre-line">
                  {card.investors.split('\n').map((line, i) => (
                    <div key={i}>
                      {line.includes('→') ? (
                        <>
                          <span className="text-gray-500">{line.split('→')[0]}→ </span>
                          <span className="text-cyan-400">{line.split('→')[1]}</span>
                        </>
                      ) : (
                        line.split(', ').map((inv, j) => (
                          <span key={j}>
                            {j > 0 && ', '}
                            <span className="text-cyan-400">{inv.includes('(') ? inv.split('(')[0] : inv}</span>
                            {inv.includes('(') && <span className="text-gray-400">({inv.split('(')[1]}</span>}
                          </span>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Priority #1 */}
              <div>
                <div className="text-cyan-500/80 text-xs uppercase tracking-wider mb-1">Priority #1</div>
                <div className="text-white">
                  <span className="text-emerald-400">{card.priority.split(' ')[0]}</span>
                  <span> {card.priority.split(' ').slice(1).join(' ')}</span>
                </div>
              </div>
              
              {/* Runway */}
              <div>
                <div className="text-cyan-500/80 text-xs uppercase tracking-wider mb-1">Runway</div>
                <div className="text-white">
                  <span className="text-cyan-400">{card.runway.split(' ')[0]}</span>
                  <span> months at </span>
                  <span className="text-cyan-400">{card.runway.match(/\$[\d-]+K/)?.[0]}</span>
                  <span> burn</span>
                </div>
              </div>
              
              {/* Insight (if exists) */}
              {card.insight && (
                <div className="text-gray-400">
                  <span className="text-emerald-400">{card.insight.split('→')[0]}</span>
                  <span>→</span>
                  <span className="text-yellow-400">{card.insight.split('→')[1]?.split(' ')[1]}</span>
                  <span className="text-purple-400"> {card.insight.split('→')[1]?.split(' ').slice(2, 4).join(' ')}</span>
                  <span> {card.insight.split('→')[1]?.split(' ').slice(4).join(' ')}</span>
                </div>
              )}
              
              {/* Generated Badge */}
              <div className="pt-2">
                <span className="text-emerald-400/80 text-xs">
                  Generated in {card.generatedTime}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

