'use client';

import { useMemo, useState } from 'react';

type Props = {
  data: any;
  onReset?: () => void;
};

// Map investor names to logo slugs (fallback to initials if no logo)
const INVESTOR_LOGO_MAP: Record<string, string> = {
  // Seed VCs
  'south park commons': 'spc',
  'antler': 'antler',
  'forum': 'forum',
  'precursor': 'precursor',
  'first round': 'firstround',
  // Micro VCs
  'calm fund': 'calmfund',
  'tiny seed': 'tinyseed',
  'earnest capital': 'earnest',
  // Angels
  'jason lemkin': 'jasonlemkin',
  'shrug capital': 'shrug',
  'naval ravikant': 'naval',
  'elad gil': 'eladgil',
  'lachy groom': 'lachy',
  // Major VCs
  'coatue': 'coatue',
  'bessemer': 'bessemer',
  'index ventures': 'index',
  'nvidia': 'nvidia',
  'andreessen horowitz': 'a16z',
  'a16z': 'a16z',
  'sequoia': 'sequoia',
  'accel': 'accel',
  'greylock': 'greylock',
  'benchmark': 'benchmark',
  'lightspeed': 'lightspeed',
  'general catalyst': 'gc',
  'founders fund': 'ff',
  'khosla': 'khosla',
  'ycombinator': 'yc',
  'y combinator': 'yc',
  // Healthcare/Specialized
  'orbimed': 'orbimed',
  'ra capital': 'racapital',
  'deerfield': 'deerfield',
  // Consumer
  'lerer hippeau': 'lererhippeau',
  'forerunner': 'forerunner',
  'greycroft': 'greycroft',
};

// Investor brand colors for visual distinction
const INVESTOR_COLORS: Record<string, string> = {
  'spc': 'from-blue-600 to-blue-800',
  'antler': 'from-orange-500 to-red-600',
  'forum': 'from-purple-600 to-indigo-700',
  'calmfund': 'from-teal-500 to-cyan-600',
  'tinyseed': 'from-green-500 to-emerald-600',
  'shrug': 'from-pink-500 to-rose-600',
  'jasonlemkin': 'from-blue-500 to-cyan-500',
  'eladgil': 'from-violet-500 to-purple-600',
  'a16z': 'from-red-600 to-orange-500',
  'sequoia': 'from-green-600 to-emerald-500',
  'yc': 'from-orange-500 to-amber-500',
  'benchmark': 'from-slate-600 to-zinc-700',
  'greylock': 'from-gray-600 to-slate-700',
  'accel': 'from-blue-700 to-indigo-600',
};

function getInvestorSlug(name: string): string {
  const lower = name.toLowerCase().trim();
  return INVESTOR_LOGO_MAP[lower] || lower.replace(/\s+/g, '').slice(0, 10);
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getPriorityColor(level: string): string {
  const l = level?.toLowerCase() || '';
  if (l === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (l === 'high') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (l === 'medium') return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

function getPriorityBorderColor(level: string): string {
  const l = level?.toLowerCase() || '';
  if (l === 'critical') return 'border-red-500';
  if (l === 'high') return 'border-amber-500';
  if (l === 'medium') return 'border-zinc-500';
  return 'border-zinc-500';
}

export default function StrategyBlueprint({ data, onReset }: Props) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Parse and normalize data from API response
  const normalized = useMemo(() => {
    const funding = data?.funding_stage ?? data?.fundingStage ?? {};
    const raise = data?.raise_amount ?? data?.raiseAmount ?? {};
    const investors = data?.investor_type ?? data?.investorType ?? {};
    const runway = data?.runway ?? {};
    const financial = data?.financial_priority ?? data?.financialPriority ?? {};
    const ideaProfile = data?.idea_understanding ?? data?.ideaProfile ?? {};
    const industrySpecialist = data?.industry_specialist ?? data?.industrySpecialist ?? {};
    const metadata = data?.metadata ?? {};
    const input = data?.input ?? {};

    // Funding stage
    const fundingStage = funding.funding_stage || funding.stage || 'Seed';
    const confidence = funding.confidence || ideaProfile.confidence || 'medium';

    // MRR and growth from input or idea profile
    const mrr = input.monthlyRevenue || ideaProfile.mrr || null;
    const growth = input.growthRate || ideaProfile.growth || null;
    
    // Team and traction highlights
    const teamHighlights = ideaProfile.team_requirements?.slice(0, 2)?.join(', ') || null;
    const tractionHighlights = input.tractionSummary || ideaProfile.notes || null;

    // Raise amount
    const raiseMin = raise.range?.min || raise.recommended_amount?.split('-')[0]?.trim() || '$500K';
    const raiseMax = raise.range?.max || raise.recommended_amount?.split('-')[1]?.trim() || '$2M';
    const marketComps = raise.rationale || '';

    // Valuation (estimate based on stage if not provided)
    const valuationMin = raise.valuation?.min || (fundingStage.toLowerCase().includes('seed') ? '$4M' : '$15M');
    const valuationMax = raise.valuation?.max || (fundingStage.toLowerCase().includes('seed') ? '$12M' : '$50M');

    // Investors
    const investorList: { name: string; slug: string }[] = [];
    if (investors.primary_investor_type) {
      investorList.push({ name: investors.primary_investor_type, slug: getInvestorSlug(investors.primary_investor_type) });
    }
    if (Array.isArray(investors.secondary_options)) {
      investors.secondary_options.forEach((inv: string) => {
        investorList.push({ name: inv, slug: getInvestorSlug(inv) });
      });
    }
    // Add specific investor names if mentioned in rationale
    if (investors.rationale) {
      const matches = investors.rationale.match(/([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)/g);
      if (matches) {
        matches.slice(0, 4).forEach((name: string) => {
          if (!investorList.find(i => i.name.toLowerCase() === name.toLowerCase())) {
            investorList.push({ name, slug: getInvestorSlug(name) });
          }
        });
      }
    }

    // Priorities
    const priorities: { title: string; reason: string; level: string }[] = [];
    if (Array.isArray(financial.priorities)) {
      financial.priorities.forEach((p: any) => {
        priorities.push({
          title: p.priority || p.category || 'Focus area',
          reason: p.rationale || p.reason || '',
          level: p.importance || p.level || 'medium',
        });
      });
    }

    // Runway
    const runwayMonths = runway.estimated_runway_months || 18;
    const burnRate = runway.monthly_burn_rate || '$50K';

    // Generation time
    const generationTime = metadata.execution_time_seconds?.toFixed(1) || '3.5';

    // Industry-specific bullets
    const industryBullets = industrySpecialist.bullets || [];
    const industryLabel = industrySpecialist.industry_label || ideaProfile.category || 'General';

    return {
      fundingStage,
      confidence,
      mrr,
      growth,
      teamHighlights,
      tractionHighlights,
      raiseAmount: { min: raiseMin, max: raiseMax, marketComps },
      valuation: { min: valuationMin, max: valuationMax },
      investors: investorList.slice(0, 6),
      priorities,
      runway: { months: runwayMonths, burn: burnRate },
      generationTime,
      startupName: data?.startup_name || input?.startupName || 'Your Startup',
      summary: data?.summary || '',
      industryBullets,
      industryLabel,
    };
  }, [data]);

  // Build one-liner summary
  const oneLiner = useMemo(() => {
    const parts: string[] = [];
    if (normalized.mrr) parts.push(`$${normalized.mrr}K MRR`);
    if (normalized.growth) parts.push(`${normalized.growth}% MoM`);
    if (normalized.teamHighlights) parts.push(normalized.teamHighlights);
    if (normalized.tractionHighlights && normalized.tractionHighlights.length < 50) {
      parts.push(normalized.tractionHighlights);
    }
    return parts.join(' · ');
  }, [normalized]);

  // Copy as markdown
  const handleCopyAsDeck = async () => {
    const industrySection = normalized.industryBullets.length > 0 
      ? `## ${normalized.industryLabel} Playbook
${normalized.industryBullets.map((b: string) => `- ${b}`).join('\n')}

` : '';

    const markdown = `# ${normalized.startupName} - Financial Strategy

## Funding Stage
**${normalized.fundingStage}** (Confidence: ${normalized.confidence})

${industrySection}## Raise Amount
**${normalized.raiseAmount.min} – ${normalized.raiseAmount.max}**
at ${normalized.valuation.min}–${normalized.valuation.max} pre-money

${normalized.raiseAmount.marketComps ? `> ${normalized.raiseAmount.marketComps}` : ''}

## Target Investors
${normalized.investors.map(i => `- ${i.name}`).join('\n')}

## Top Priority
${normalized.priorities[0]?.title || 'N/A'}
${normalized.priorities[0]?.reason || ''}

## Runway
${normalized.runway.months} months at ${normalized.runway.burn}/mo burn

---
Generated by FinIQ.ai in ${normalized.generationTime}s
`;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Share strategy
  const handleShare = async () => {
    const text = `Just got my startup's financial strategy from @FinIQai:\n\n📍 Stage: ${normalized.fundingStage}\n💰 Raise: ${normalized.raiseAmount.min}–${normalized.raiseAmount.max}\n🎯 Priority: ${normalized.priorities[0]?.title || 'Growth'}\n\nTry it free → finiq.ai`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text, url: 'https://finiq.ai' });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to Twitter
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(tweetUrl, '_blank');
    }
  };

  // Runway bar position (capped at 36 months)
  const runwayPosition = Math.min((normalized.runway.months / 36) * 100, 100);

  return (
    <>
      {/* Main Container */}
      <div className="max-w-4xl mx-auto bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Gradient Header Bar */}
        <div className="h-24 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-between px-8 md:px-12">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-white tracking-tight">FinIQ.ai</div>
          </div>
          <div className="text-zinc-400 text-sm text-right">
            <span>Generated in {normalized.generationTime}s</span>
            <span className="mx-2">·</span>
            <span>Confidence: {normalized.confidence}</span>
          </div>
        </div>

        {/* Content Stack */}
        <div className="py-12 md:py-16 px-8 md:px-12 space-y-12 md:space-y-16">
          
          {/* Funding Stage */}
          <div>
            <div className="flex items-center gap-4 md:gap-6 flex-wrap">
              <h1 className="text-5xl md:text-6xl font-light text-white tracking-tight">
                {normalized.fundingStage}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                normalized.confidence === 'high' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : normalized.confidence === 'medium'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {normalized.confidence}
              </span>
            </div>
            {oneLiner && (
              <p className="text-lg md:text-xl text-zinc-300 mt-4">{oneLiner}</p>
            )}
          </div>

          {/* Industry-Specific Playbook */}
          {normalized.industryBullets.length > 0 && (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#2a2a2a] rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎯</span>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  {normalized.industryLabel} Playbook
                </h2>
              </div>
              <p className="text-sm text-zinc-500 mb-4">
                What actually matters in this exact niche in 2025:
              </p>
              <ul className="space-y-3">
                {normalized.industryBullets.map((bullet: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 text-sm">•</span>
                    <span className="text-zinc-300 text-sm md:text-base leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raise Amount */}
          <div>
            <div className="text-5xl md:text-7xl font-light text-white tracking-tight">
              {normalized.raiseAmount.min} – {normalized.raiseAmount.max}
            </div>
            <div className="text-xl md:text-2xl text-zinc-400 mt-2">
              at {normalized.valuation.min}–{normalized.valuation.max} pre-money
            </div>
            {normalized.raiseAmount.marketComps && (
              <p className="italic text-base md:text-lg text-zinc-500 mt-4 max-w-2xl">
                {normalized.raiseAmount.marketComps}
              </p>
            )}
          </div>

          {/* Investor Grid */}
          {normalized.investors.length > 0 && (
            <div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
                {normalized.investors.map((investor, idx) => {
                  const colorClass = INVESTOR_COLORS[investor.slug] || 'from-zinc-700 to-zinc-800';
                  return (
                    <div key={idx} className="flex flex-col items-center group">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br ${colorClass} border border-white/10 flex items-center justify-center hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5 transition-all duration-200`}>
                        <span className="text-lg md:text-xl font-bold text-white/90">
                          {getInitials(investor.name)}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 mt-2 text-center truncate max-w-full">
                        {investor.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-zinc-400 text-center mt-6 text-sm">
                Investors actively writing checks in this category right now
              </p>
            </div>
          )}

          {/* Priority #1 */}
          {normalized.priorities.length > 0 && (
            <div className={`border-l-4 ${getPriorityBorderColor(normalized.priorities[0].level)} pl-6 md:pl-8 py-8 md:py-10 bg-[#1a1a1a] rounded-r-xl`}>
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Priority #1</div>
              <div className="text-xl md:text-2xl font-medium text-white">
                {normalized.priorities[0].title}
              </div>
              {normalized.priorities[0].reason && (
                <p className="text-base md:text-lg text-zinc-400 mt-2">
                  {normalized.priorities[0].reason}
                </p>
              )}
            </div>
          )}

          {/* Remaining Priorities */}
          {normalized.priorities.length > 1 && (
            <div className="space-y-3">
              {normalized.priorities.slice(1).map((priority, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start justify-between gap-4 p-4 md:p-5 bg-[#161616] border border-[#222222] rounded-xl"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">{priority.title}</div>
                    {priority.reason && (
                      <p className="text-sm text-zinc-500 mt-1">{priority.reason}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(priority.level)}`}>
                    {priority.level}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Runway Bar */}
          <div>
            <div className="text-lg md:text-xl text-white mb-4">
              <span className="font-semibold">{normalized.runway.months} months</span>
              <span className="text-zinc-400"> runway at </span>
              <span className="font-semibold">{normalized.runway.burn}/mo</span>
              <span className="text-zinc-400"> burn</span>
            </div>
            <div className="relative h-2 md:h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 overflow-visible">
              {/* Marker */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full border-2 border-[#111111] shadow-lg transition-all duration-300"
                style={{ left: `calc(${runwayPosition}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>0</span>
              <span>12 mo</span>
              <span>24 mo</span>
              <span>36+ mo</span>
            </div>
          </div>

          {/* Summary */}
          {normalized.summary && (
            <div className="pt-8 border-t border-[#222222]">
              <p className="text-zinc-400 leading-relaxed">{normalized.summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c0c]/95 backdrop-blur-sm border-t border-[#222222] py-4 md:py-6 z-50">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-3 md:gap-4">
          <button
            onClick={handleCopyAsDeck}
            className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm md:text-base font-medium"
          >
            {copySuccess ? '✓ Copied!' : 'Copy as Deck'}
          </button>
          <button
            onClick={handleShare}
            className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm md:text-base font-medium"
          >
            Share Strategy
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg bg-white text-black hover:bg-zinc-200 transition-all text-sm md:text-base font-medium"
            >
              New Strategy
            </button>
          )}
        </div>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-24" />
    </>
  );
}

