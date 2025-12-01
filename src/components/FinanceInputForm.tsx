'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import FormProgress from '@/components/FormProgress';
import type { StartupInputs } from '@/types/finance-copilot';

const DRAFT_KEY = 'finiq_draft';

interface FinanceInputFormProps {
  onSubmit: (inputs: StartupInputs) => Promise<void> | void;
  isLoading: boolean;
  /** Pre-fill form with these values (e.g., from duplicate scenario) */
  initialValues?: Partial<StartupInputs>;
}

export default function FinanceInputForm({ onSubmit, isLoading, initialValues }: FinanceInputFormProps) {
  const [inputs, setInputs] = useState<StartupInputs>({
    startupName: '',
    industry: '',
    targetMarket: 'B2B',
    geography: 'United States',
    ideaDescription: '',
    teamSize: 1,
    productStage: 'Idea',
    monthlyRevenue: undefined,
    growthRate: '',
    tractionSummary: '',
    businessModel: '',
    fundingGoal: undefined,
    mainFinancialConcern: '',
  });
  
  const [currentSection, setCurrentSection] = useState(0);
  const [draftRestored, setDraftRestored] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Section refs for scroll tracking
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Load saved draft or initial values on mount
  useEffect(() => {
    // Priority: initialValues > saved draft
    if (initialValues && Object.keys(initialValues).length > 0) {
      setInputs(prev => ({ ...prev, ...initialValues }));
      setDraftRestored(true);
      return;
    }
    
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setInputs(prev => ({ ...prev, ...parsed }));
        setDraftRestored(true);
      }
    } catch (e) {
      console.warn('Failed to restore draft:', e);
    }
  }, [initialValues]);
  
  // Auto-save to localStorage on every change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(inputs));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timeout);
  }, [inputs]);
  
  // Track scroll position to update progress bar
  const handleScroll = useCallback(() => {
    if (!formRef.current) return;
    
    const viewportMiddle = window.innerHeight / 2;
    
    // Find which section is most visible
    let activeSection = 0;
    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (rect.top < viewportMiddle && rect.bottom > viewportMiddle / 2) {
          activeSection = index;
        }
      }
    });
    
    setCurrentSection(activeSection);
  }, []);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  // Clear draft on successful submit
  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const maybePromise = onSubmit(inputs);
      if (maybePromise && typeof (maybePromise as any).then === 'function') {
        (maybePromise as Promise<void>)
          .then(() => clearDraft())
          .catch((err) => {
            console.error('Form submit error:', err);
          });
      } else {
        clearDraft();
      }
    } catch (err) {
      console.error('Form submit error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <FormProgress currentSection={currentSection} />
      
      {/* Draft restored notification */}
      {draftRestored && (
        <div className="max-w-2xl mx-auto mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 flex items-center justify-between">
          <span>✓ Draft restored from your last session</span>
          <button 
            type="button"
            onClick={() => {
              setInputs({
                startupName: '',
                industry: '',
                targetMarket: 'B2B',
                geography: 'United States',
                ideaDescription: '',
                teamSize: 1,
                productStage: 'Idea',
                monthlyRevenue: undefined,
                growthRate: '',
                tractionSummary: '',
                businessModel: '',
                fundingGoal: undefined,
                mainFinancialConcern: '',
              });
              clearDraft();
              setDraftRestored(false);
            }}
            className="text-emerald-400/60 hover:text-emerald-400 underline text-xs"
          >
            Clear & start fresh
          </button>
        </div>
      )}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div ref={el => { sectionRefs.current[0] = el; }} className="glass-strong rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="startupName" className="text-white/80">
                Startup Name / Idea *
              </Label>
              <Input
                id="startupName"
                value={inputs.startupName}
                onChange={(e) => setInputs({ ...inputs, startupName: e.target.value })}
                placeholder="e.g., AI-powered expense tracker"
                required
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="ideaDescription" className="text-white/80">
                Describe your startup idea (2–5 sentences) *
              </Label>
              <Textarea
                id="ideaDescription"
                value={inputs.ideaDescription}
                onChange={(e) => setInputs({ ...inputs, ideaDescription: e.target.value })}
                placeholder="Explain what your product does, who it is for, and why it matters."
                rows={3}
                required
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="industry" className="text-white/80">
                Industry / Sector *
              </Label>
              <Input
                id="industry"
                value={inputs.industry}
                onChange={(e) => setInputs({ ...inputs, industry: e.target.value })}
                placeholder="e.g., Fintech, Healthcare, SaaS"
                required
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetMarket" className="text-white/80">
                  Target Market
                </Label>
                <Select
                  id="targetMarket"
                  value={inputs.targetMarket}
                  onValueChange={(value: any) => setInputs({ ...inputs, targetMarket: value })}
                  className="mt-1.5"
                >
                  <SelectItem value="B2B">B2B (Business to Business)</SelectItem>
                  <SelectItem value="B2C">B2C (Business to Consumer)</SelectItem>
                  <SelectItem value="B2B2C">B2B2C (Hybrid)</SelectItem>
                </Select>
              </div>

              <div>
                <Label htmlFor="geography" className="text-white/80">
                  Geography / Base Country
                </Label>
                <Input
                  id="geography"
                  value={inputs.geography}
                  onChange={(e) => setInputs({ ...inputs, geography: e.target.value })}
                  placeholder="e.g., United States, India, UK"
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team & Product Section */}
        <div ref={el => { sectionRefs.current[1] = el; }} className="glass-strong rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Team & Product</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teamSize" className="text-white/80">
                  Current Team Size
                </Label>
                <Input
                  id="teamSize"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1"
                  value={inputs.teamSize === 0 ? '' : inputs.teamSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setInputs({ ...inputs, teamSize: val === '' ? 0 : parseInt(val, 10) });
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure minimum value of 1 on blur
                    if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                      setInputs({ ...inputs, teamSize: 1 });
                    }
                  }}
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="productStage" className="text-white/80">
                  Stage of Product
                </Label>
                <Select
                  id="productStage"
                  value={inputs.productStage}
                  onValueChange={(value: any) => setInputs({ ...inputs, productStage: value })}
                  className="mt-1.5"
                >
                  <SelectItem value="Idea">Idea (Concept stage)</SelectItem>
                  <SelectItem value="MVP">MVP (Built)</SelectItem>
                  <SelectItem value="Beta">Beta (Testing)</SelectItem>
                  <SelectItem value="Early Revenue">Early Revenue</SelectItem>
                  <SelectItem value="Growth">Growth Stage</SelectItem>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Traction & Revenue Section */}
        <div ref={el => { sectionRefs.current[2] = el; }} className="glass-strong rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Traction & Revenue</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyRevenue" className="text-white/80">
                  Monthly Recurring Revenue (USD)
                </Label>
                <Input
                  id="monthlyRevenue"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={inputs.monthlyRevenue ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setInputs({ ...inputs, monthlyRevenue: val === '' ? undefined : parseInt(val, 10) });
                    }
                  }}
                  placeholder="Leave empty if pre-revenue"
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <Label htmlFor="growthRate" className="text-white/80">
                  Growth Rate (optional)
                </Label>
                <Input
                  id="growthRate"
                  value={inputs.growthRate}
                  onChange={(e) => setInputs({ ...inputs, growthRate: e.target.value })}
                  placeholder="e.g., 20% MoM, 100 signups/week"
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tractionSummary" className="text-white/80">
                Traction Summary (optional)
              </Label>
              <Textarea
                id="tractionSummary"
                value={inputs.tractionSummary}
                onChange={(e) => setInputs({ ...inputs, tractionSummary: e.target.value })}
                placeholder="Any notable traction: users, partnerships, press coverage..."
                rows={3}
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Financial Details Section */}
        <div ref={el => { sectionRefs.current[3] = el; }} className="glass-strong rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Financial Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessModel" className="text-white/80">
                Business Model *
              </Label>
              <Input
                id="businessModel"
                value={inputs.businessModel}
                onChange={(e) => setInputs({ ...inputs, businessModel: e.target.value })}
                placeholder="e.g., SaaS subscription, Marketplace, Transaction fees"
                required
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="fundingGoal" className="text-white/80">
                Funding Goal (USD, optional)
              </Label>
              <Input
                id="fundingGoal"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                value={inputs.fundingGoal ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setInputs({ ...inputs, fundingGoal: val === '' ? undefined : parseInt(val, 10) });
                  }
                }}
                placeholder="e.g., 500000 for $500K"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="mainFinancialConcern" className="text-white/80">
                Main Financial Concern Right Now *
              </Label>
              <Textarea
                id="mainFinancialConcern"
                value={inputs.mainFinancialConcern}
                onChange={(e) => setInputs({ ...inputs, mainFinancialConcern: e.target.value })}
                placeholder="e.g., Need capital to hire engineers, Running out of runway, Need to prove PMF before raising"
                required
                rows={3}
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary-light h-12 text-base font-semibold"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Strategy...
            </span>
          ) : (
            'Generate Finance Strategy'
          )}
        </Button>

        <p className="text-xs text-white/40 text-center">
          * Required fields • Processing typically takes 10-20 seconds • Auto-saved as you type
        </p>
      </form>
    </div>
  );
}
