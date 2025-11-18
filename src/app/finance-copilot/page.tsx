'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import FinanceInputForm from '@/components/FinanceInputForm';
import LoadingState from '@/components/LoadingState';
import ErrorCard from '@/components/ErrorCard';
import ResponseViewer from '@/components/ResponseViewer';
import type { StartupInputs } from '@/types/finance-copilot';
import { postGenerate } from '@/lib/api';

export default function FinanceCopilotPage() {
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialExhausted, setTrialExhausted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize or fetch persistent user_id
  useEffect(() => {
    try {
      const key = 'finance_user_id';
      const existing = localStorage.getItem(key);
      if (existing) {
        setUserId(existing);
      } else {
        const generated = `user_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        localStorage.setItem(key, generated);
        setUserId(generated);
      }
    } catch {}
  }, []);

  const buildPrompt = (i: StartupInputs) => {
    return [
      `Startup: ${i.startupName}`,
      i.ideaDescription ? `Idea: ${i.ideaDescription}` : '',
      `Industry: ${i.industry}`,
      `Market: ${i.targetMarket}`,
      `Stage: ${i.productStage}`,
      `Team: ${i.teamSize}`,
      `MRR: ${i.monthlyRevenue ?? 0}`,
      `Geography: ${i.geography}`,
      `Business Model: ${i.businessModel}`,
      i.growthRate ? `Growth: ${i.growthRate}` : '',
      i.tractionSummary ? `Traction: ${i.tractionSummary}` : '',
      i.fundingGoal ? `Funding Goal: ${i.fundingGoal}` : '',
      `Concern: ${i.mainFinancialConcern}`,
    ].filter(Boolean).join(' | ');
  };

  const handleSubmit = async (inputs: StartupInputs) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setTrialExhausted(false);

    try {
      const payload = {
        user_id: userId,
        prompt: buildPrompt(inputs),
        input_overrides: { ...inputs },
      };

      const res = await postGenerate(payload);

      if (!res.ok) {
        if (res.status === 403) {
          setTrialExhausted(true);
          const msg = typeof res.error === 'string'
            ? res.error
            : ((res.error as any)?.detail || 'Free trial has been exhausted.');
          setError(typeof msg === 'string' ? msg : 'Free trial has been exhausted.');
          return;
        }
        const msg =
          typeof res.error === 'string'
            ? res.error
            : 'Unable to reach the FinIQ.ai backend. Please check that the service is running and try again.';
        setError(msg);
        return;
      }

      const data = res.data!;
      setResult(data.response);
      // persist latest
      try { localStorage.setItem('finance_last_response', JSON.stringify(data.response)); } catch {}
      // Scroll to results
      setTimeout(() => { document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setTrialExhausted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-[#0d1117] to-black pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              FinIQ.ai
            </h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Get personalized funding recommendations powered by AI. 
              Answer a few questions about your startup and receive a complete financial strategy.
            </p>
          </motion.div>

          {/* Input Form */}
          {!result && !trialExhausted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FinanceInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
              <ErrorCard
                message={error}
                ctaLabel={'Try Again'}
                onCta={handleReset}
              />
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <LoadingState />
            </motion.div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <div id="results">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Your Strategy</h2>
                <button
                  onClick={handleReset}
                  className="text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  Generate New Strategy
                </button>
              </div>
              <ResponseViewer data={result} />
            </div>
          )}

          {/* Info Footer */}
          {!result && !isLoading && !trialExhausted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                Powered by Gemini 2.0 AI • 6 Specialized Agents
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

