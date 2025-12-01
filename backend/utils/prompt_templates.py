"""
Prompt Templates for FinIQ.ai Agents
Each agent has a structured prompt with clear role, context, and output format.
"""


class PromptTemplates:
    """Collection of all agent prompt templates."""
    
    @staticmethod
    def _get_industry_bullets_section(startup_data: dict) -> str:
        """
        Build the industry-specific bullets section from IndustrySpecialistAgent output.
        This provides hyper-specific, niche-aware context to all downstream agents.
        """
        industry_bullets = startup_data.get('industryBullets')
        
        if industry_bullets and isinstance(industry_bullets, dict):
            bullets = industry_bullets.get('bullets', [])
            industry_label = industry_bullets.get('industry_label', 'General')
            confidence = industry_bullets.get('confidence', 'medium')
            
            if bullets:
                bullets_text = '\n'.join([f"• {b}" for b in bullets])
                return f"""
**INDUSTRY-SPECIFIC REALITIES ({industry_label}, confidence: {confidence}):**
These are the ACTUAL things that matter in this exact niche in 2025. Use these to ground your recommendations:

{bullets_text}

**CRITICAL:** Your recommendations MUST align with these industry-specific realities. Do NOT give generic advice that contradicts these bullets.
"""
        
        return "\n**INDUSTRY-SPECIFIC REALITIES:** Not available (will use general guidance)\n"
    
    @staticmethod
    def idea_understanding_agent(startup_data: dict) -> str:
        """Prompt for understanding the startup idea and deriving a structured profile."""
        startup_name = startup_data.get('startup_name') or startup_data.get('startupName', 'N/A')
        one_line = startup_data.get('one_line_description') or startup_data.get('oneLineDescription') or startup_name
        idea_desc = startup_data.get('idea_description') or startup_data.get('ideaDescription', 'N/A')
        industry = startup_data.get('industry', 'N/A')
        business_model = startup_data.get('businessModel') or startup_data.get('business_model', 'N/A')
        target_market = startup_data.get('targetMarket') or startup_data.get('target_market', 'N/A')
        
        return f"""You are a senior startup analyst. Your job is to deeply understand a startup idea and output a concise, structured profile.

STARTUP INPUTS:
- Name: {startup_name}
- One-line Description: {one_line}
- Full Idea Description: {idea_desc}
- Industry: {industry}
- Business Model: {business_model}
- Target Market: {target_market}

YOUR TASK:
Analyze this startup across the following dimensions:
1. What category does it belong to? (e.g., "AI Infrastructure", "FinTech SaaS", "Food Delivery")
2. How does it make money?
3. Capital intensity (Very High/High/Medium/Low) - Does it need lots of upfront CapEx?
4. Burn profile (Very High/High/Medium/Low) - Monthly burn rate expectations
5. Hardware dependency (Very High/High/Medium/Low) - Reliance on physical infrastructure
6. Operational complexity (Very High/High/Medium/Low) - Day-to-day operational demands
7. Regulation risk (Very High/High/Medium/Low) - Compliance and legal overhead
8. How does it scale?
9. Margin profile (Very High/High/Medium/Low) - Expected gross margins
10. What team roles are most critical?

CRITICAL INSTRUCTIONS:
- DO NOT output any explanation, markdown, comments, or extra text.
- DO NOT use code fences like ```json or ```.
- Output ONLY the raw JSON object below with NO other text before or after.
- Ensure the JSON is valid and parseable.
- If the input is unclear or nonsense, still return valid JSON with "Unknown" or "Low confidence" values and mark confidence as "low".

OUTPUT FORMAT (return EXACTLY this structure with your values):
{{
  "category": "short domain label",
  "business_model": "brief description of revenue model",
  "capital_intensity": "Very High | High | Medium | Low",
  "burn_profile": "Very High | High | Medium | Low",
  "hardware_dependency": "Very High | High | Medium | Low",
  "operational_complexity": "Very High | High | Medium | Low",
  "regulation_risk": "Very High | High | Medium | Low",
  "scalability_model": "one sentence on how it scales",
  "margin_profile": "Very High | High | Medium | Low",
  "team_requirements": ["role1", "role2", "role3"],
  "confidence": "high | medium | low",
  "notes": "one or two sentences of additional context"
}}

Remember: Output ONLY the JSON object. No markdown. No explanation. No code fences. Just the raw JSON."""
    
    @staticmethod
    def funding_stage_agent(startup_data: dict) -> str:
        """Prompt for determining funding stage."""
        idea_profile = startup_data.get('ideaProfile')
        industry_bullets_section = PromptTemplates._get_industry_bullets_section(startup_data)
        
        # Extract specific fields from idea_profile for better context
        if idea_profile and isinstance(idea_profile, dict):
            idea_profile_section = f"""
**IDEA PROFILE (from IdeaUnderstandingAgent):**
- Category: {idea_profile.get('category', 'N/A')}
- Business Model: {idea_profile.get('business_model', 'N/A')}
- Capital Intensity: {idea_profile.get('capital_intensity', 'N/A')}
- Burn Profile: {idea_profile.get('burn_profile', 'N/A')}
- Hardware Dependency: {idea_profile.get('hardware_dependency', 'N/A')}
- Operational Complexity: {idea_profile.get('operational_complexity', 'N/A')}
- Regulation Risk: {idea_profile.get('regulation_risk', 'N/A')}
- Scalability Model: {idea_profile.get('scalability_model', 'N/A')}
- Margin Profile: {idea_profile.get('margin_profile', 'N/A')}
- Confidence: {idea_profile.get('confidence', 'N/A')}
"""
        else:
            idea_profile_section = "\n**IDEA PROFILE:** Not available (will rely on basic inputs only)\n"

        startup_name = startup_data.get('startup_name') or startup_data.get('startupName', 'N/A')
        one_line = startup_data.get('one_line_description') or startup_data.get('oneLineDescription') or startup_name
        idea_desc = startup_data.get('idea_description') or startup_data.get('ideaDescription', 'N/A')

        return f"""You are a senior startup finance advisor specializing in funding strategies.

**Your Role:** Analyze the startup profile and determine the most appropriate funding stage.

**STARTUP INPUTS:**
- Name: {startup_name}
- One-line Description: {one_line}
- Full Idea Description: {idea_desc}
- Industry: {startup_data.get('industry', 'N/A')}
- Target Market: {startup_data.get('targetMarket', 'N/A')}
- Geography: {startup_data.get('geography', 'N/A')}
- Team Size: {startup_data.get('teamSize', 0)}
- Product Stage: {startup_data.get('productStage', 'N/A')}
- Monthly Revenue: ${startup_data.get('monthlyRevenue', 0)}
- Growth Rate: {startup_data.get('growthRate', 'N/A')}
- Traction: {startup_data.get('tractionSummary', 'N/A')}
- Business Model: {startup_data.get('businessModel', 'N/A')}
- Funding Goal: ${startup_data.get('fundingGoal', 'Not specified')}
{idea_profile_section}{industry_bullets_section}
**CRITICAL:** Use the Idea Profile fields above (especially capital intensity, burn profile, operational complexity) AND the Industry-Specific Realities to refine your funding stage recommendation. These provide deep context about the startup's economic characteristics and niche-specific requirements.

**Available Stages:**
- Idea Stage (no product yet)
- Pre-Seed (MVP in development, no revenue)
- Seed (product launched, early traction)
- Series A (product-market fit, scaling)
- Series B+ (established revenue, expansion)
- Bootstrapped/Profitable (no external funding needed)

**Output Format (JSON only):**
{{
  "funding_stage": "one of the stages above",
  "confidence": "high/medium/low",
  "rationale": "2-3 sentence explanation based on product stage, revenue, traction, idea profile, AND industry-specific realities",
  "stage_characteristics": "key indicators that led to this recommendation"
}}

Return ONLY valid JSON, no markdown or extra text."""
    
    @staticmethod
    def raise_amount_agent(startup_data: dict, funding_stage: str) -> str:
        """Prompt for determining raise amount."""
        idea_profile = startup_data.get('ideaProfile')
        industry_bullets_section = PromptTemplates._get_industry_bullets_section(startup_data)
        
        # Extract specific fields from idea_profile
        if idea_profile and isinstance(idea_profile, dict):
            idea_profile_section = f"""
**IDEA PROFILE (from IdeaUnderstandingAgent):**
- Category: {idea_profile.get('category', 'N/A')}
- Capital Intensity: {idea_profile.get('capital_intensity', 'N/A')} (CRITICAL for raise amount)
- Burn Profile: {idea_profile.get('burn_profile', 'N/A')} (CRITICAL for raise amount)
- Hardware Dependency: {idea_profile.get('hardware_dependency', 'N/A')}
- Operational Complexity: {idea_profile.get('operational_complexity', 'N/A')}
- Margin Profile: {idea_profile.get('margin_profile', 'N/A')}
"""
        else:
            idea_profile_section = "\n**IDEA PROFILE:** Not available\n"

        startup_name = startup_data.get('startup_name') or startup_data.get('startupName', 'N/A')
        one_line = startup_data.get('one_line_description') or startup_data.get('oneLineDescription') or startup_name
        idea_desc = startup_data.get('idea_description') or startup_data.get('ideaDescription', 'N/A')

        return f"""You are a startup CFO advisor specializing in fundraising strategy.

**Your Role:** Recommend the ideal funding amount to raise.

**STARTUP INPUTS:**
- Name: {startup_name}
- Idea Description: {idea_desc}
- Industry: {startup_data.get('industry', 'N/A')}
- Target Market: {startup_data.get('targetMarket', 'N/A')}
- Team Size: {startup_data.get('teamSize', 0)}
- Monthly Revenue: ${startup_data.get('monthlyRevenue', 0)}
- Funding Stage: {funding_stage}
- Funding Goal (user input): ${startup_data.get('fundingGoal', 'Not specified')}
- Main Financial Concern: {startup_data.get('mainFinancialConcern', 'N/A')}
{idea_profile_section}{industry_bullets_section}
**CRITICAL:** Use Capital Intensity, Burn Profile, AND Industry-Specific Realities to adjust the raise amount:
- Very High Capital Intensity → Increase raise by 50-100% above stage average
- High Burn Profile → Add 6 months of extra runway buffer
- Hardware-heavy startups → Factor in equipment/infrastructure costs
- Industry bullets mention specific CapEx (e.g., "₹18–22L per shed", "$200Cr for certification") → Include these in calculations

**Task:** Calculate the recommended raise amount based on:
1. Typical range for this funding stage
2. Team size and hiring needs
3. Capital intensity from idea profile
4. Burn profile expectations
5. Runway target (18-24 months typical)
6. User's stated goal (if provided)
7. SPECIFIC COSTS mentioned in industry bullets (e.g., certifications, equipment, inventory)
Use ALL information provided (including the full description, idea profile, AND industry-specific bullets) to determine the most accurate output.
Do not fallback unless absolutely necessary.

**Output Format (JSON only):**
{{
  "recommended_amount": "e.g., $500K-$750K",
  "minimum_viable": "lowest amount that makes sense",
  "optimal_amount": "ideal amount for 18-24mo runway",
  "rationale": "explanation of calculation referencing industry-specific costs",
  "breakdown": {{
    "team_expansion": "estimated cost",
    "product_development": "estimated cost",
    "marketing_sales": "estimated cost",
    "operations_overhead": "estimated cost",
    "buffer": "contingency"
  }}
}}

Return ONLY valid JSON, no markdown or extra text."""
    
    @staticmethod
    def investor_type_agent(startup_data: dict, funding_stage: str, raise_amount: str) -> str:
        """Prompt for identifying ideal investor types."""
        idea_profile = startup_data.get('ideaProfile')
        industry_bullets_section = PromptTemplates._get_industry_bullets_section(startup_data)
        
        # Extract specific fields from idea_profile
        if idea_profile and isinstance(idea_profile, dict):
            idea_profile_section = f"""
**IDEA PROFILE (from IdeaUnderstandingAgent):**
- Category: {idea_profile.get('category', 'N/A')} (helps identify domain-focused investors)
- Capital Intensity: {idea_profile.get('capital_intensity', 'N/A')}
- Regulation Risk: {idea_profile.get('regulation_risk', 'N/A')} (CRITICAL for investor selection)
- Hardware Dependency: {idea_profile.get('hardware_dependency', 'N/A')}
- Margin Profile: {idea_profile.get('margin_profile', 'N/A')}
- Scalability Model: {idea_profile.get('scalability_model', 'N/A')}
"""
        else:
            idea_profile_section = "\n**IDEA PROFILE:** Not available\n"

        startup_name = startup_data.get('startup_name') or startup_data.get('startupName', 'N/A')
        one_line = startup_data.get('one_line_description') or startup_data.get('oneLineDescription') or startup_name
        idea_desc = startup_data.get('idea_description') or startup_data.get('ideaDescription', 'N/A')

        return f"""You are a startup fundraising strategist with deep investor network knowledge.

**Your Role:** Identify the best investor types AND specific investor names for this startup.

**STARTUP INPUTS:**
- Name: {startup_name}
- Idea Description: {idea_desc}
- Industry: {startup_data.get('industry', 'N/A')}
- Target Market: {startup_data.get('targetMarket', 'N/A')}
- Geography: {startup_data.get('geography', 'N/A')}
- Funding Stage: {funding_stage}
- Raise Amount: {raise_amount}
- Business Model: {startup_data.get('businessModel', 'N/A')}
{idea_profile_section}{industry_bullets_section}
**CRITICAL:** Use the Idea Profile AND Industry-Specific Realities to match investors:
- High Regulation Risk → Seek investors with domain expertise (e.g., FinTech VCs, HealthTech VCs)
- Hardware-heavy → Prefer deep-tech investors, avoid pure software VCs
- High Capital Intensity → Target larger funds with multi-stage capacity
- Specific Category → Match to sector-focused investors (AI Infrastructure → AI funds, FinTech → FinTech funds)
- Industry bullets mention specific investors/funds → Prioritize those EXACT names

**Investor Categories:**
- Angel Investors (individual high-net-worth)
- Micro VCs ($50K-$500K checks) — e.g., Tiny Seed, Calm Fund, Earnest Capital
- Seed VCs ($500K-$2M checks) — e.g., South Park Commons, Antler, Forum
- Institutional VCs (Series A+) — e.g., Sequoia, a16z, Accel
- Corporate VCs (strategic investors)
- Accelerators (Y Combinator, Techstars, etc.)
- Government Grants/Programs — e.g., iDEX, Make-II, FAME-II, TDF
- Crowdfunding
- Revenue-Based Financing

**Output Format (JSON only):**
{{
  "primary_investor_type": "most suitable type",
  "secondary_options": ["alternative type 1", "alternative type 2"],
  "specific_investors": ["Name actual funds/angels that fit this niche"],
  "avoid": ["types that don't make sense for this stage/model"],
  "rationale": "why these investors are ideal based on category, regulation risk, capital needs, AND industry-specific realities",
  "target_profile": "specific characteristics to look for in investors",
  "approach_strategy": "how to approach these investors"
}}

Return ONLY valid JSON, no markdown or extra text."""
    
    @staticmethod
    def runway_agent(startup_data: dict, raise_amount: str) -> str:
        """Prompt for calculating runway."""
        idea_profile = startup_data.get('ideaProfile')
        industry_bullets_section = PromptTemplates._get_industry_bullets_section(startup_data)
        
        # Extract specific fields from idea_profile
        if idea_profile and isinstance(idea_profile, dict):
            idea_profile_section = f"""
**IDEA PROFILE (from IdeaUnderstandingAgent):**
- Burn Profile: {idea_profile.get('burn_profile', 'N/A')} (CRITICAL for runway calculation)
- Operational Complexity: {idea_profile.get('operational_complexity', 'N/A')} (affects overhead)
- Hardware Dependency: {idea_profile.get('hardware_dependency', 'N/A')} (affects CapEx)
- Team Requirements: {idea_profile.get('team_requirements', [])} (affects headcount burn)
- Capital Intensity: {idea_profile.get('capital_intensity', 'N/A')}
"""
        else:
            idea_profile_section = "\n**IDEA PROFILE:** Not available\n"

        startup_name = startup_data.get('startup_name') or startup_data.get('startupName', 'N/A')
        one_line = startup_data.get('one_line_description') or startup_data.get('oneLineDescription') or startup_name
        idea_desc = startup_data.get('idea_description') or startup_data.get('ideaDescription', 'N/A')

        return f"""You are a startup financial planning expert.

**Your Role:** Calculate expected runway and burn rate guidance.

Startup Name:
{startup_name}

One-line Description:
{one_line}

Full Startup Idea Description:
{idea_desc}

**STARTUP INPUTS:**
- Name: {startup_name}
- Idea Description: {idea_desc}
- Team Size: {startup_data.get('teamSize', 0)}
- Monthly Revenue: ${startup_data.get('monthlyRevenue', 0)}
- Industry: {startup_data.get('industry', 'N/A')}
- Geography: {startup_data.get('geography', 'N/A')}
- Raise Amount: {raise_amount}
- Main Financial Concern: {startup_data.get('mainFinancialConcern', 'N/A')}
{idea_profile_section}{industry_bullets_section}
**CRITICAL:** Use the Idea Profile AND Industry-Specific Realities to estimate burn rate accurately:
- High Burn Profile → Monthly burn 30-50% higher than stage average
- High Operational Complexity → Add 20-30% overhead buffer
- Hardware Dependency → Factor in CapEx and depreciation
- Team Requirements → Adjust headcount assumptions by role types
- Industry bullets mention specific costs (e.g., "₹18–22L per shed", "$400K+ for VP Growth") → Factor these into burn calculations

**Task:** Estimate runway and provide burn rate guidance.

**Consider:**
1. Current team cost (salaries, benefits)
2. Expected hiring based on raise amount and team requirements from idea profile
3. Burn profile expectations from idea profile
4. SPECIFIC COSTS from industry bullets (certifications, equipment, key hires)
5. Geography-based cost differences (India vs US vs Europe)
6. Revenue (if any) offsetting burn
7. Target runway: 18-24 months

**Output Format (JSON only):**
{{
  "estimated_runway_months": "12-18",
  "monthly_burn_rate": "$50K-$75K",
  "assumptions": {{
    "team_costs": "breakdown including specific roles from industry bullets",
    "operational_expenses": "breakdown including industry-specific costs",
    "growth_investments": "breakdown"
  }},
  "revenue_impact": "how current/projected revenue affects runway",
  "key_milestones": ["what should be achieved within this runway, aligned with industry bullets"],
  "burn_rate_guidance": "advice on managing burn rate specific to this niche"
}}

Return ONLY valid JSON, no markdown or extra text."""
    
    @staticmethod
    def financial_priority_agent(startup_data: dict, context: dict) -> str:
        """Prompt for determining financial priorities."""
        idea_profile = startup_data.get('ideaProfile')
        industry_bullets_section = PromptTemplates._get_industry_bullets_section(startup_data)
        
        # Extract specific fields from idea_profile
        if idea_profile and isinstance(idea_profile, dict):
            idea_profile_section = f"""
**IDEA PROFILE (from IdeaUnderstandingAgent):**
- Category: {idea_profile.get('category', 'N/A')}
- Business Model: {idea_profile.get('business_model', 'N/A')}
- Capital Intensity: {idea_profile.get('capital_intensity', 'N/A')}
- Operational Complexity: {idea_profile.get('operational_complexity', 'N/A')}
- Hardware Dependency: {idea_profile.get('hardware_dependency', 'N/A')}
- Regulation Risk: {idea_profile.get('regulation_risk', 'N/A')}
- Team Requirements: {idea_profile.get('team_requirements', [])}
- Margin Profile: {idea_profile.get('margin_profile', 'N/A')}
"""
        else:
            idea_profile_section = "\n**IDEA PROFILE:** Not available\n"

        startup_name = startup_data.get('startup_name') or startup_data.get('startupName', 'N/A')
        one_line = startup_data.get('one_line_description') or startup_data.get('oneLineDescription') or startup_name
        idea_desc = startup_data.get('idea_description') or startup_data.get('ideaDescription', 'N/A')

        return f"""You are a strategic startup advisor focused on financial prioritization.

**Your Role:** Identify the top 3-5 immediate financial priorities that are SPECIFIC to this exact niche.

**STARTUP INPUTS:**
- Name: {startup_name}
- Idea Description: {idea_desc}
- Industry: {startup_data.get('industry', 'N/A')}
- Product Stage: {startup_data.get('productStage', 'N/A')}
- Team Size: {startup_data.get('teamSize', 0)}
- Monthly Revenue: ${startup_data.get('monthlyRevenue', 0)}
- Main Concern: {startup_data.get('mainFinancialConcern', 'N/A')}

**Previous Agent Outputs:**
- Funding Stage: {context.get('funding_stage', 'N/A')}
- Raise Amount: {context.get('raise_amount', 'N/A')}
- Investor Type: {context.get('investor_type', 'N/A')}
- Runway: {context.get('runway', 'N/A')}
{idea_profile_section}{industry_bullets_section}
**CRITICAL:** Your priorities MUST be derived from the Industry-Specific Realities above. Do NOT give generic advice like "hire key roles" or "optimize operations". Instead:
- If bullets mention specific certifications → Priority: Get that exact certification
- If bullets mention specific hires (e.g., "ex-Swiggy fleet manager") → Priority: Hire that exact role
- If bullets mention specific partnerships → Priority: Close that partnership
- If bullets mention specific price points → Priority: Achieve that unit economics target
- If bullets mention specific platforms → Priority: Launch on that platform

**Task:** Define the top financial priorities for the next 6-12 months, DIRECTLY DERIVED from the industry-specific bullets.

**Priority Categories:**
- Fundraising activities
- Team expansion/hiring (SPECIFIC roles from bullets)
- Product development investment
- Marketing & customer acquisition (SPECIFIC channels from bullets)
- Sales team & GTM strategy
- Infrastructure & operations (SPECIFIC requirements from bullets)
- Legal & compliance (SPECIFIC certifications from bullets)
- Cash flow management
- Unit economics optimization (SPECIFIC targets from bullets)

**Output Format (JSON only):**
{{
  "priorities": [
    {{
      "priority": "SPECIFIC action item derived from industry bullets",
      "importance": "critical/high/medium",
      "rationale": "why this matters now, referencing industry-specific context",
      "timeline": "when to address",
      "estimated_cost": "if applicable, use costs from industry bullets"
    }}
  ],
  "quick_wins": ["easy immediate actions from industry bullets"],
  "avoid": ["what NOT to spend money on in this specific niche"],
  "success_metrics": ["how to measure progress, using metrics from industry bullets"]
}}

Return ONLY valid JSON, no markdown or extra text."""

