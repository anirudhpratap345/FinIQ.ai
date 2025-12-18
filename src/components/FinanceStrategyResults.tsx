'use client';

import { motion } from 'framer-motion';
import type { FundingStrategy } from '@/types/finance-copilot';
import { formatCurrency } from '@/lib/validation/finance-inputs';

interface FinanceStrategyResultsProps {
  strategy: FundingStrategy;
  userMetrics?: {
    generation_count?: number;
    average_rating?: number;
  };
}

export default function FinanceStrategyResults({ strategy, userMetrics }: FinanceStrategyResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Summary */}
      <div className="glass-strong rounded-xl p-6 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">
          Your Funding Strategy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-white/60 mb-1">Stage</div>
            <div className="text-lg font-semibold text-white">
              {strategy.recommendedStage.stage}
            </div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-1">Raise Amount</div>
            <div className="text-lg font-semibold text-white">
              {formatCurrency(strategy.raiseAmount.recommended, 'short')}
            </div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-1">Runway</div>
            <div className="text-lg font-semibold text-white">
              {strategy.runway.estimatedMonths} months
            </div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-1">Confidence</div>
            <div className="text-lg font-semibold text-white">
              {(strategy.confidence.overall * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Stage */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
      >
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Recommended Funding Stage
        </h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-4xl font-bold text-white">
            {strategy.recommendedStage.stage}
          </div>
          <div className="flex-1">
            <div className="text-sm text-white/60 mb-1">
              Confidence: {(strategy.recommendedStage.confidence * 100).toFixed(0)}%
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${strategy.recommendedStage.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">
          {strategy.recommendedStage.reasoning}
        </p>
      </motion.div>

      {/* Raise Amount */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
      >
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">💰</span>
          Recommended Raise Amount
        </h3>
        <div className="text-4xl font-bold text-white mb-2">
          {formatCurrency(strategy.raiseAmount.recommended, 'long')}
        </div>
        <div className="text-sm text-white/60 mb-3">
          Range: {formatCurrency(strategy.raiseAmount.range.min, 'short')} - {formatCurrency(strategy.raiseAmount.range.max, 'short')}
        </div>
        <p className="text-sm text-white/80 leading-relaxed">
          {strategy.raiseAmount.reasoning}
        </p>
      </motion.div>

      {/* Investor Types */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🤝</span>
          Target Investors
        </h3>
        <div className="space-y-3">
          {strategy.investorTypes.map((investor, index) => (
            <div key={index} className="flex gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                <span className="text-lg font-bold text-white">
                  #{investor.priority}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white mb-1 flex items-center gap-2">
                  {investor.type}
                  {investor.typicalCheckSize && (
                    <span className="text-xs text-white/60 font-normal">
                      ({investor.typicalCheckSize})
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  {investor.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Runway & Burn */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
      >
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Runway & Burn Rate
        </h3>
        <div className="text-4xl font-bold text-white mb-2">
          {strategy.runway.estimatedMonths} months
        </div>
        <div className="text-sm text-white/60 mb-3">
          Monthly Burn: {formatCurrency(strategy.runway.monthlyBurnEstimate.recommended, 'short')} 
          <span className="text-white/40 ml-1">
            ({formatCurrency(strategy.runway.monthlyBurnEstimate.min, 'short')} - {formatCurrency(strategy.runway.monthlyBurnEstimate.max, 'short')})
          </span>
        </div>
        <p className="text-sm text-white/80 mb-4 leading-relaxed">
          {strategy.runway.burnRateGuidance}
        </p>
        <div className="text-xs text-white/60">
          <div className="font-semibold mb-2">Key Assumptions:</div>
          <ul className="list-disc list-inside space-y-1">
            {strategy.runway.keyAssumptions.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Financial Priorities */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Financial Allocation
        </h3>
        <div className="space-y-4">
          {strategy.priorities.map((priority, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white">{priority.category}</span>
                <span className="text-2xl font-bold text-white">{priority.allocation}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${priority.allocation}%` }}
                />
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                {priority.reasoning}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Funding Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
      >
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          Funding Narrative
        </h3>
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
          {strategy.fundingNarrative}
        </p>
      </motion.div>

      {/* Risks & Milestones */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Key Risks
          </h3>
          <ul className="space-y-2">
            {strategy.keyRisks.map((risk, index) => (
              <li key={index} className="text-sm text-white/70 flex gap-2 leading-relaxed">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-strong rounded-xl p-6 border border-white/10 hover-glow-border"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="text-xl">✓</span>
            Next Milestones
          </h3>
          <ul className="space-y-2">
            {strategy.nextMilestones.map((milestone, index) => (
              <li key={index} className="text-sm text-white/70 flex gap-2 leading-relaxed">
                <span className="text-green-400 mt-0.5">•</span>
                <span>{milestone}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Confidence Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass-subtle rounded-xl p-6 border border-white/5"
      >
        <h3 className="text-sm font-semibold text-white/60 mb-3">Confidence Breakdown</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-white/40 mb-1">Data Completeness</div>
            <div className="text-lg font-semibold text-white">
              {(strategy.confidence.factors.dataCompleteness * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1">Market Clarity</div>
            <div className="text-lg font-semibold text-white">
              {(strategy.confidence.factors.marketClarity * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1">Stage Alignment</div>
            <div className="text-lg font-semibold text-white">
              {(strategy.confidence.factors.stageAlignment * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        {strategy.confidence.caveats.length > 0 && (
          <div className="text-xs text-white/40 space-y-1">
            <div className="font-semibold">Caveats:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {strategy.confidence.caveats.map((caveat, index) => (
                <li key={index}>{caveat}</li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

