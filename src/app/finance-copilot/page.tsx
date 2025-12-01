'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import FinanceInputForm from '@/components/FinanceInputForm';
import LoadingState from '@/components/LoadingState';
import ErrorCard from '@/components/ErrorCard';
import ResponseViewer from '@/components/ResponseViewer';
import type { StartupInputs } from '@/types/finance-copilot';
import { postGenerate } from '@/lib/api';

const DUPLICATE_KEY = 'finiq_duplicate_scenario';

// Inner component that uses useSearchParams - must be wrapped in Suspense
function FinanceCopilotContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialExhausted, setTrialExhausted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastInputs, setLastInputs] = useState<StartupInputs | null>(null);
  const [duplicateInputs, setDuplicateInputs] = useState<Partial<StartupInputs> | undefined>(undefined);

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
  
  // Handle duplicate scenario from URL param
  useEffect(() => {
    if (searchParams.get('duplicate') === 'true') {
      try {
        const saved = sessionStorage.getItem(DUPLICATE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          setDuplicateInputs(data);
          sessionStorage.removeItem(DUPLICATE_KEY);
          // Clean up URL
          router.replace('/finance-copilot');
        }
      } catch (e) {
        console.warn('Failed to restore duplicate scenario:', e);
      }
    }
  }, [searchParams, router]);

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
    setLastInputs(inputs); // Store for duplicate feature
    setDuplicateInputs(undefined); // Clear duplicate inputs after submit

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
            : 'Unable to reach the FinIQ backend. Please check that the service is running and try again.';
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
  
  // Handle duplicate scenario - saves inputs and scrolls to form
  const handleDuplicate = (inputs: StartupInputs) => {
    // Save to sessionStorage for persistence across page reload
    try {
      sessionStorage.setItem(DUPLICATE_KEY, JSON.stringify(inputs));
    } catch {}
    
    // Reset state and show form with pre-filled values
    setResult(null);
    setDuplicateInputs(inputs);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setTrialExhausted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          FinIQ
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
          {/* Show hint when duplicating */}
          {duplicateInputs && (
            <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400 text-center">
              💡 Scenario loaded — change one field (like MRR or team size) and see how your strategy changes!
            </div>
          )}
          <FinanceInputForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading}
            initialValues={duplicateInputs}
          />
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
          <ResponseViewer 
            data={result} 
            onReset={handleReset}
            formInputs={lastInputs}
            onDuplicate={handleDuplicate}
          />
        </div>
      )}
    </>
  );
}

// Loading fallback for Suspense
function PageLoadingFallback() {
  return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/60" />
      <p className="text-white/40 mt-4">Loading...</p>
    </div>
  );
}

// Main page component with Suspense boundary
export default function FinanceCopilotPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-black via-[#0d1117] to-black pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<PageLoadingFallback />}>
            <FinanceCopilotContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
