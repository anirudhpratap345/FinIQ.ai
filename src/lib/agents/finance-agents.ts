/**
 * FinIQ.ai - AI Agent Chain
 * 
 * Multi-agent system for generating funding strategies:
 * 1. FundingStageAgent - Determines appropriate funding stage
 * 2. RaiseAmountAgent - Calculates raise amount
 * 3. InvestorMatchAgent - Matches investor types
 * 4. RunwayAgent - Calculates runway and burn rate
 * 5. PriorityAgent - Allocates financial priorities
 * 6. SynthesisAgent - Creates narrative and identifies risks
 */

import type {
  StartupInputs,
  FundingStrategy,
  StageAnalysisResult,
  RaiseCalculationResult,
  InvestorMatchResult,
  RunwayCalculationResult,
  PriorityAllocationResult,
  SynthesisResult,
  OverallConfidence,
} from '@/types/finance-copilot';
import { calculateDataCompleteness } from '@/lib/validation/finance-inputs';

// Initialize Gemini (we'll use fetch API directly for simplicity)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Call Gemini API with retry logic
 */
async function callGemini(prompt: string, temperature: number = 0.3): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: 4000,
        topP: 0.95,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No text generated from Gemini');
  }

  return text;
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 */
function parseGeminiJSON<T>(text: string): T {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse JSON:', cleaned);
    throw new Error('Invalid JSON response from AI');
  }
}

// ============================================================================
// AGENT 1: FUNDING STAGE ANALYZER
// ============================================================================

export async function analyzeFundingStage(inputs: StartupInputs): Promise<StageAnalysisResult> {
  const prompt = `You are a startup funding stage advisor. Analyze the following startup and recommend the appropriate funding stage.

STARTUP DATA:
- Name: ${inputs.startupName}
- Idea: ${inputs.ideaDescription || 'Not provided'}
- Industry: ${inputs.industry}
- Product Stage: ${inputs.productStage}
- Team Size: ${inputs.teamSize}
- Monthly Revenue: ${inputs.monthlyRevenue ? `$${inputs.monthlyRevenue.toLocaleString()}` : 'Pre-revenue'}
- Traction: ${inputs.tractionSummary || 'No traction data provided'}
- Growth: ${inputs.growthRate || 'Not specified'}

TASK:
Recommend ONE funding stage from: Bootstrapped, Pre-Seed, Seed, Series A, Series B, Series C+

Consider:
- Product maturity (${inputs.productStage})
- Team size (${inputs.teamSize} people)
- Revenue status (${inputs.monthlyRevenue ? 'generating revenue' : 'pre-revenue'})
- Market dynamics in ${inputs.industry}

Provide clear reasoning and rate your confidence (0-1 scale).

RETURN ONLY VALID JSON in this exact format:
{
  "stage": "Seed",
  "reasoning": "Based on product being in ${inputs.productStage} stage with ${inputs.teamSize} team members...",
  "confidence": 0.85,
  "keyFactors": ["Product maturity", "Team composition", "Revenue traction"]
}`;

  console.log('🔍 Agent 1: Analyzing funding stage...');
  const response = await callGemini(prompt, 0.2); // Low temperature for consistency
  return parseGeminiJSON<StageAnalysisResult>(response);
}

// ============================================================================
// AGENT 2: RAISE AMOUNT CALCULATOR
// ============================================================================

export async function calculateRaiseAmount(
  inputs: StartupInputs,
  stageAnalysis: StageAnalysisResult
): Promise<RaiseCalculationResult> {
  const prompt = `You are a startup funding calculator. Calculate the recommended raise amount based on stage and startup details.

STARTUP DATA:
- Stage: ${stageAnalysis.stage}
- Idea: ${inputs.ideaDescription || 'Not provided'}
- Industry: ${inputs.industry}
- Team Size: ${inputs.teamSize}
- Geography: ${inputs.geography}
- Target Market: ${inputs.targetMarket}
- Business Model: ${inputs.businessModel}
- Current MRR: ${inputs.monthlyRevenue ? `$${inputs.monthlyRevenue.toLocaleString()}` : 'None'}
- User's Funding Goal: ${inputs.fundingGoal ? `$${inputs.fundingGoal.toLocaleString()}` : 'Not specified'}

TYPICAL RANGES BY STAGE:
- Bootstrapped: $0
- Pre-Seed: $50K - $500K
- Seed: $500K - $3M
- Series A: $3M - $15M
- Series B: $15M - $50M
- Series C+: $50M+

TASK:
1. Calculate recommended raise amount in USD
2. Provide realistic min-max range
3. Consider: industry burn rates, ${inputs.geography} market, ${inputs.teamSize}-person team costs
4. If user provided a goal ($${inputs.fundingGoal?.toLocaleString() || 'none'}), validate if realistic

RETURN ONLY VALID JSON:
{
  "recommended": 1500000,
  "range": { "min": 800000, "max": 2000000 },
  "reasoning": "For ${stageAnalysis.stage} in ${inputs.industry}, typical raise is...",
  "methodology": "Based on 18-month runway for ${inputs.teamSize}-person team in ${inputs.geography}"
}`;

  console.log('💰 Agent 2: Calculating raise amount...');
  const response = await callGemini(prompt, 0.3);
  return parseGeminiJSON<RaiseCalculationResult>(response);
}

// ============================================================================
// AGENT 3: INVESTOR TYPE MATCHER
// ============================================================================

export async function matchInvestorTypes(
  inputs: StartupInputs,
  stageAnalysis: StageAnalysisResult,
  raiseCalculation: RaiseCalculationResult
): Promise<InvestorMatchResult> {
  const prompt = `You are a startup-investor matching expert. Recommend 2-4 suitable investor types for this startup.

STARTUP PROFILE:
- Idea: ${inputs.ideaDescription || 'Not provided'}
- Stage: ${stageAnalysis.stage}
- Raise Amount: $${raiseCalculation.recommended.toLocaleString()}
- Industry: ${inputs.industry}
- Target Market: ${inputs.targetMarket}
- Geography: ${inputs.geography}
- Business Model: ${inputs.businessModel}

INVESTOR TYPES TO CHOOSE FROM:
- Angel: Individual investors, $10K-$100K checks, early stage
- Micro-VC: Small funds, $100K-$500K checks, pre-seed/seed
- Accelerator: Y Combinator, Techstars, etc., $100K-$500K + mentorship
- Seed Fund: Dedicated seed VCs, $500K-$2M checks
- Corporate VC: Strategic investors from big companies
- Traditional VC: Established firms, Series A+, $3M+ checks
- Crowdfunding: Kickstarter, Republic, community-funded

TASK:
1. Select 2-4 most appropriate investor types
2. Rank by priority (1 = highest, 5 = lowest)
3. Explain why each type fits
4. Consider: raise size ($${raiseCalculation.recommended.toLocaleString()}), stage (${stageAnalysis.stage}), industry (${inputs.industry})

RETURN ONLY VALID JSON (array of objects):
{
  "matches": [
    {
      "type": "Accelerator",
      "priority": 1,
      "reasoning": "Early stage + need mentorship...",
      "typicalCheckSize": "$100K-$500K"
    },
    {
      "type": "Angel",
      "priority": 2,
      "reasoning": "Raise size aligns with angel checks...",
      "typicalCheckSize": "$25K-$100K"
    }
  ],
  "reasoning": "Overall matching strategy...",
  "marketContext": "Current ${inputs.geography} investor landscape for ${inputs.industry}..."
}`;

  console.log('🤝 Agent 3: Matching investor types...');
  const response = await callGemini(prompt, 0.3);
  return parseGeminiJSON<InvestorMatchResult>(response);
}

// ============================================================================
// AGENT 4: RUNWAY & BURN RATE CALCULATOR
// ============================================================================

export async function calculateRunway(
  inputs: StartupInputs,
  raiseCalculation: RaiseCalculationResult
): Promise<RunwayCalculationResult> {
  const prompt = `You are a startup financial planning advisor. Calculate runway and provide burn rate guidance.

STARTUP DATA:
- Team Size: ${inputs.teamSize} people
- Idea: ${inputs.ideaDescription || 'Not provided'}
- Raise Amount: $${raiseCalculation.recommended.toLocaleString()}
- Geography: ${inputs.geography}
- Industry: ${inputs.industry}
- Current MRR: ${inputs.monthlyRevenue ? `$${inputs.monthlyRevenue.toLocaleString()}` : '$0'}
- Product Stage: ${inputs.productStage}

TYPICAL COSTS IN ${inputs.geography}:
- Engineer salary: $100K-$180K/year
- Marketing: 15-30% of budget
- Infrastructure: $2K-$10K/month
- Operations: 10-15% of budget

TASK:
1. Estimate runway in months (raise ÷ monthly burn)
2. Calculate monthly burn estimates (conservative, realistic, aggressive)
3. Provide burn rate guidance specific to ${inputs.teamSize}-person team
4. List key assumptions

Target: 18-24 months runway is ideal for ${raiseCalculation.recommended > 1000000 ? 'seed+' : 'early'} stage

RETURN ONLY VALID JSON:
{
  "estimatedMonths": 18,
  "burnRateGuidance": "With $${raiseCalculation.recommended.toLocaleString()} raised, aim for $80-100K/month burn...",
  "monthlyBurnEstimate": {
    "min": 70000,
    "max": 120000,
    "recommended": 90000
  },
  "keyAssumptions": [
    "Average salary: $130K/year per team member in ${inputs.geography}",
    "Marketing: 20% of burn ($18K/month)",
    "Infrastructure: $5K/month for ${inputs.productStage} stage"
  ]
}`;

  console.log('📊 Agent 4: Calculating runway...');
  const response = await callGemini(prompt, 0.3);
  return parseGeminiJSON<RunwayCalculationResult>(response);
}

// ============================================================================
// AGENT 5: FINANCIAL PRIORITIES ALLOCATOR
// ============================================================================

export async function allocatePriorities(
  inputs: StartupInputs,
  stageAnalysis: StageAnalysisResult
): Promise<PriorityAllocationResult> {
  const prompt = `You are a startup resource allocation advisor. Recommend how to allocate the raised funds across categories.

STARTUP CONTEXT:
- Idea: ${inputs.ideaDescription || 'Not provided'}
- Stage: ${stageAnalysis.stage}
- Product Stage: ${inputs.productStage}
- Main Concern: ${inputs.mainFinancialConcern}
- Business Model: ${inputs.businessModel}
- Team Size: ${inputs.teamSize}
- Industry: ${inputs.industry}

CATEGORIES TO ALLOCATE:
- Hiring: Salaries, recruiting, HR
- Product: Engineering, design, infrastructure
- Marketing: Advertising, content, brand
- Sales: Sales team, CRM, partnerships
- Operations: Legal, accounting, office
- GTM: Go-to-market strategy
- R&D: Research, experiments
- Reserve: Emergency fund (aim for 10-15%)

TASK:
Allocate percentages across these categories.
- Total must equal 100%
- Consider: product stage (${inputs.productStage}), main concern (${inputs.mainFinancialConcern})
- Explain each allocation
- Minimum 3 categories, maximum 6 categories

RETURN ONLY VALID JSON:
{
  "priorities": [
    {
      "category": "Hiring",
      "allocation": 35,
      "reasoning": "Need to grow from ${inputs.teamSize} to 15 people for scale..."
    },
    {
      "category": "Product",
      "allocation": 30,
      "reasoning": "Critical to reach production-ready state..."
    }
  ],
  "reasoning": "Overall allocation strategy focused on ${inputs.mainFinancialConcern}...",
  "total": 100
}`;

  console.log('🎯 Agent 5: Allocating financial priorities...');
  const response = await callGemini(prompt, 0.3);
  return parseGeminiJSON<PriorityAllocationResult>(response);
}

// ============================================================================
// AGENT 6: STRATEGY SYNTHESIZER
// ============================================================================

export async function synthesizeStrategy(
  inputs: StartupInputs,
  stageAnalysis: StageAnalysisResult,
  raiseCalculation: RaiseCalculationResult,
  investorMatch: InvestorMatchResult,
  runwayCalculation: RunwayCalculationResult,
  priorityAllocation: PriorityAllocationResult
): Promise<SynthesisResult> {
  const prompt = `You are a startup funding narrative expert. Create a compelling, realistic funding strategy narrative.

COMPLETE STRATEGY SO FAR:
Stage: ${stageAnalysis.stage}
Raise: $${raiseCalculation.recommended.toLocaleString()} (${raiseCalculation.range.min.toLocaleString()}-${raiseCalculation.range.max.toLocaleString()})
Top Investors: ${investorMatch.matches.map(m => m.type).join(', ')}
Runway: ${runwayCalculation.estimatedMonths} months
Top Priority: ${priorityAllocation.priorities[0].category} (${priorityAllocation.priorities[0].allocation}%)

STARTUP CONTEXT:
${JSON.stringify(inputs, null, 2)}

TASK:
1. Write a 3-4 paragraph funding narrative that:
   - Tells a coherent story about the startup's funding journey
   - Explains WHY this stage and amount make sense
   - Connects product stage, market, and financial needs
   - Addresses the founder's main concern: "${inputs.mainFinancialConcern}"

2. Identify 3-5 KEY RISKS the founder should watch:
   - Market risks
   - Execution risks
   - Financial risks
   - Competitive risks

3. List 3-5 CONCRETE NEXT MILESTONES:
   - Specific, measurable goals
   - Timeframe-bound (next 3-12 months)
   - Tied to funding stages

4. Calculate OVERALL CONFIDENCE:
   - Based on data completeness and strategy coherence
   - Provide caveats/disclaimers

RETURN ONLY VALID JSON:
{
  "fundingNarrative": "Your startup, ${inputs.startupName}, is positioned for a ${stageAnalysis.stage} round of $${raiseCalculation.recommended.toLocaleString()}. Given your product is at the ${inputs.productStage} stage in the ${inputs.industry} space, this raise will enable you to...",
  "keyRisks": [
    "Market timing: ${inputs.industry} is highly competitive with...",
    "Burn rate: With ${inputs.teamSize} people, you'll need to carefully manage...",
    "Product-market fit: At ${inputs.productStage} stage, key validation needed..."
  ],
  "nextMilestones": [
    "Achieve $${Math.max(50000, (inputs.monthlyRevenue || 0) * 2).toLocaleString()} MRR within 6 months",
    "Hire ${Math.max(2, Math.floor(inputs.teamSize * 0.5))} key team members (${priorityAllocation.priorities[0].category})",
    "Launch MVP to 100 beta customers by Q2 2025"
  ],
  "confidence": {
    "overall": 0.85,
    "factors": {
      "dataCompleteness": 0.8,
      "marketClarity": 0.85,
      "stageAlignment": 0.9
    },
    "caveats": [
      "Market conditions may vary",
      "Actual fundraising timelines depend on investor interest",
      "Burn rates should be validated against actual expenses"
    ]
  }
}`;

  console.log('📝 Agent 6: Synthesizing strategy narrative...');
  const response = await callGemini(prompt, 0.4); // Higher temp for creative narrative
  return parseGeminiJSON<SynthesisResult>(response);
}

// ============================================================================
// MASTER ORCHESTRATOR
// ============================================================================

/**
 * Generate complete funding strategy using multi-agent chain
 */
export async function generateFinanceStrategy(
  inputs: StartupInputs
): Promise<FundingStrategy> {
  const startTime = Date.now();

  try {
    console.log('🚀 Starting Finance Strategy Generation...');
    console.log(`📋 Startup: ${inputs.startupName} (${inputs.industry})`);

    // Agent 1: Analyze funding stage
    const stageAnalysis = await analyzeFundingStage(inputs);
    console.log(`✅ Stage: ${stageAnalysis.stage} (confidence: ${(stageAnalysis.confidence * 100).toFixed(0)}%)`);

    // Agent 2: Calculate raise amount
    const raiseCalculation = await calculateRaiseAmount(inputs, stageAnalysis);
    console.log(`✅ Raise: $${(raiseCalculation.recommended / 1000000).toFixed(2)}M`);

    // Agent 3: Match investor types
    const investorMatch = await matchInvestorTypes(inputs, stageAnalysis, raiseCalculation);
    console.log(`✅ Investors: ${investorMatch.matches.length} types matched`);

    // Agent 4: Calculate runway
    const runwayCalculation = await calculateRunway(inputs, raiseCalculation);
    console.log(`✅ Runway: ${runwayCalculation.estimatedMonths} months`);

    // Agent 5: Allocate priorities
    const priorityAllocation = await allocatePriorities(inputs, stageAnalysis);
    console.log(`✅ Priorities: ${priorityAllocation.priorities.length} categories allocated`);

    // Agent 6: Synthesize narrative
    const synthesis = await synthesizeStrategy(
      inputs,
      stageAnalysis,
      raiseCalculation,
      investorMatch,
      runwayCalculation,
      priorityAllocation
    );
    console.log(`✅ Narrative: Generated with ${synthesis.keyRisks.length} risks, ${synthesis.nextMilestones.length} milestones`);

    // Calculate actual data completeness
    const dataCompleteness = calculateDataCompleteness(inputs);
    synthesis.confidence.factors.dataCompleteness = dataCompleteness;

    // Assemble final strategy
    const strategy: FundingStrategy = {
      recommendedStage: {
        stage: stageAnalysis.stage,
        reasoning: stageAnalysis.reasoning,
        confidence: stageAnalysis.confidence,
      },
      raiseAmount: {
        recommended: raiseCalculation.recommended,
        range: raiseCalculation.range,
        reasoning: raiseCalculation.reasoning,
      },
      investorTypes: investorMatch.matches,
      runway: {
        estimatedMonths: runwayCalculation.estimatedMonths,
        burnRateGuidance: runwayCalculation.burnRateGuidance,
        monthlyBurnEstimate: runwayCalculation.monthlyBurnEstimate,
        keyAssumptions: runwayCalculation.keyAssumptions,
      },
      priorities: priorityAllocation.priorities,
      fundingNarrative: synthesis.fundingNarrative,
      keyRisks: synthesis.keyRisks,
      nextMilestones: synthesis.nextMilestones,
      generatedAt: new Date().toISOString(),
      confidence: synthesis.confidence,
    };

    const duration = Date.now() - startTime;
    console.log(`🎉 Finance Strategy Generated in ${(duration / 1000).toFixed(1)}s`);

    return strategy;

  } catch (error) {
    console.error('❌ Finance strategy generation failed:', error);
    throw error;
  }
}

