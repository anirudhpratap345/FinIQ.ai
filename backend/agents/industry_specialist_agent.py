"""
Industry Specialist Agent
Generates hyper-specific, niche-aware bullets for any startup vertical.
Acts like a brutally specific VC with 15+ years and 200+ deals in niche verticals.
"""

import os
import json
import re
import logging
from typing import Dict, Any, List

from .base_agent import BaseAgent
from utils.llm_client import llm_client

logger = logging.getLogger(__name__)


class IndustrySpecialistAgent(BaseAgent):
    """
    Takes the raw startup description and outputs 5-8 hyper-specific bullets
    that actually matter in this exact niche in 2025.
    
    Uses ZERO generic terms like "operational efficiency", "hire key roles",
    "optimize unit economics". Instead outputs concrete levers: specific platforms,
    roles, certifications, gov schemes, city names, margins, price bands, quantity targets.
    """

    # Massive few-shot prompt with 25+ industry examples
    FEW_SHOT_EXAMPLES = """
SOFT TOYS / PLUSHIES
• Lock two Yiwu/Shenzhen OEMs at ≤$2.20 landed cost on hero SKU
• Hire ex-SHEIN TikTok Shop lead who has done 7-figure plush drops
• File 10 provisional character designs Week 1 to block copycats
• Pre-negotiate Walmart Spark Good pilot + Costco holiday 2026 slot
• Target $6.99–$9.99 on TikTok Shop to hit 40%+ margins after ads
• Launch 50 new SKUs/week, kill bottom 20% weekly

PSYCHOLOGY / THERAPY PRACTICE (US)
• Get credentialed with top 5 insurance panels (Aetna, United, Cigna, BCBS) in first 90 days
• Hire billing specialist who has done >$2M/year psychology claims
• Partner with 3 APA-accredited PhD programs for beta therapists
• Price at $79–$99/session to match insurance co-pay sweet spot
• Launch TikTok "therapy in your state" geo-fenced ads

AGRICULTURE / FARMTECH (India)
• Capture PM-KISAN / state subsidy flow — one district officer relationship = 10K farmers
• Hire ex-Mahindra / ITC agro field managers as first 5 employees
• Price hardware at ₹8K–12K so farmer ROI < 9 months
• Partner with local cooperative banks for 0% financing tie-ups
• Target NABARD refinance schemes for working capital

GOVERNMENT CONTRACTING / DEFENCE / IR AGENCY
• At least one founder needs active TS/SCI or past $50M+ contract win
• Hire ex-State Dept / DRDO / OFB officer as VP Growth (budget $400K+)
• Register as SDVOSB / 8(a) / Make-II / iDEX if possible — instant sole-source eligibility
• First target: embassies in GCC/ASEAN needing India lobbying
• Target iDEX or TDF route first — ₹1–5Cr non-dilutive

GOAT / POULTRY FARMING
• Secure mother-unit contracts with BigBasket / Licious at ₹240–280/kg live weight
• Build 5,000-bird climate-controlled sheds (₹18–22L capex each)
• Hire veterinary doctor who has worked with Venky's or Suguna
• Get FSSAI + APEDA certification in first 4 months
• Target 15–18% mortality rate (industry avg 22%) to win contracts

WEDDING PLANNER (Tier-2/3 India)
• Lock 15 banquet halls on revenue-share (no fixed rent)
• Build Instagram reel team that shoots 40 reels per wedding
• Offer ₹1.5L–₹3.5L packages (beat local uncles charging ₹80K cash)
• Hire makeup artists on commission (₹8K–15K per event)
• Launch "destination wedding" packages to Jaipur/Udaipur at ₹8–12L

COWORKING (Tier-2 India)
• Lock 15-year commercial lease conversions at ₹25–35/sqft in Lucknow/Patna
• Offer ₹4,999 unlimited desk + free chai (beat Innov8/91springboard pricing)
• Hire community managers from local colleges who run Instagram meme pages
• Partner with local CA/CS firms for bulk seat bookings
• Target 65% occupancy in Month 3 to break even

NICHE E-COMMERCE (₹199 products)
• Build entire funnel on Meesho + Instagram Shops (zero CAC)
• Target 32–38% gross margin after 27% Meesho commission
• Launch 50 new SKUs every week, kill bottom 20% weekly
• Hire content creators from Meerut/Surat who know local trends
• Use WhatsApp Business for repeat orders (40% cheaper than ads)

TRADITIONAL PSYCHOLOGY CLINIC (offline India)
• Location within 1 km of top 3 schools in the city
• Hire 2 child psychologists with RCI license + 5+ years experience
• Offer free parent workshops to fill weekend slots
• Price sessions at ₹800–₹1,500 (sweet spot for urban middle class)
• Partner with schools for bulk counseling contracts

ONLYFANS / CREATOR AGENCY
• Recruit top 0.5% creators (already earning >$15K/mo)
• Offer 15% management fee (industry standard 20–50%)
• Hire ex-Team X / Neon / PinkCherry growth lead who has scaled 7-figure creators
• Launch on Fansly + MYM as hedge against OnlyFans policy risk
• Build automated DM response system (80% of revenue is from PPV DMs)

E-VTOL / URBAN AIR MOBILITY (India)
• Get DGCA Type Certificate roadmap locked with ex-AAI officer
• Partner with state governments for heli-pad → vertiport conversion
• Target medical organ transport contracts first (₹8–12L per flight)
• Hire ex-HAL/NAL engineers for certification compliance
• Budget ₹200Cr+ for full certification cycle

DATING APPS (Hinge / Bumble / Aisle clone)
• Launch in 3 Tier-1 cities first — Delhi, Bangalore, Mumbai — 70%+ users come from here
• Hire 6 "prompt engineers" who rewrite user answers (this is the real moat)
• Get 1,000 paid female users in first 30 days or the app dies (gender ratio < 35% women = dead)
• Partner with OYO / wedding venues for offline date packages
• Offer ₹799 "verified salary badge" — converts 18% of men

MATRIMONY (Jeevansaathi / Shaadi / BharatMatrimony)
• Get 5,000 verified mothers on the platform in first 60 days — they do 80% of the matching
• Hire ex-JeevanSaathi community managers from Tier-2 cities (they know every caste combo)
• Launch "Astro-match" filter — 42% of Indian users won't talk without kundali
• Offer ₹1,999 "featured profile" for 15 days — this is 90% of revenue
• Partner with local pandits for horoscope verification

QUICK COMMERCE (Zepto / Blinkit / Instamart)
• Lock dark stores within 1.2 km radius in top 15% pin codes of Bangalore/Mumbai/Delhi
• Target 38–42% gross margin after 9% Zepto commission + 18% GST
• Hire ex-BigBasket category managers who know which 400 SKUs drive 80% orders
• Launch 10-min Maggi + condom combo at 2 AM — this is the viral hook
• Build rider fleet of 200+ per dark store for <12 min delivery

HYPERLOCAL FOOD DELIVERY (Swiggy / Zomato clone)
• Sign 400 active restaurants in first 30 days or you're dead
• Offer 0% commission for first 45 days + ₹1,500 onboarding bonus
• Hire ex-Swiggy fleet managers who control 200+ riders in one zone
• Launch "Swiggy Genius" style ₹149/month subscription — this is the real money
• Target 25% take rate after Year 1

FASHION E-COMMERCE (Myntra / Ajio / Nykaa Fashion)
• Get 100+ influencers with 50K–500K followers on 30-day return commission
• Target 34–38% gross margin after 28% returns + 12% ads
• Launch "try at home" in top 8 cities — converts 3.5×
• Hire ex-Myntra merch buyers who know which kurtas sell in Lucknow vs Chennai
• Build size recommendation AI to cut returns by 15%

EDTECH / TEXTBOOK PUBLISHERS (McGraw Hill / Pearson India)
• Get NCERT + state board alignment for Class 9–12 first — everything else is noise
• Partner with 500 coaching institutes for bulk licensing (₹99/student)
• Launch JEE/NEET crash course bundles at ₹999 — this is 70% revenue
• Hire ex-Allen / Aakash faculty as content heads
• Build doubt-solving feature with <2 min response time

TRAVEL META / FLIGHT SEARCH (Skyscanner / MakeMyTrip / Cleartrip)
• Get direct API contracts with Indigo, Air India, Akasa — this is the real moat
• Launch "flexi-date" ±3 day search — 60% users use this
• Offer ₹299 "cancel for any reason" add-on — 22% attach rate
• Hire ex-Goibibo growth hackers who know Google Flights arbitrage
• Target 3–4% take rate on domestic, 6–8% on international

INSURANCE (LIC / PolicyBazaar / Digit clones)
• Get IRDAI sandbox approval in first 60 days or forget it
• Launch ₹49/month "dengue + chikungunya" micro-policy — viral in monsoon
• Partner with 1,000 pharmacies for cashless OPD claims
• Hire ex-PolicyBazaar underwriting heads who can price mortality tables
• Target 65% loss ratio in Year 1 (industry avg 75%)

HARDWARE STARTUPS (boAt / Noise / Fireboltt style)
• Lock two factories in Noida/Delhi NCR with ₹18–22 landed cost on TWS
• Launch on Amazon + Flipkart with 42% margin after 28% commission
• Hire ex-boAt product managers who have done 7-figure audio launches
• Offer 18-month warranty — this is the trust signal in India
• Target ₹999–₹1,499 price point for volume (80% of market)

AI / ML INFRASTRUCTURE
• Lock GPU capacity contracts with CoreWeave / Lambda / Paperspace at <$2/hr for H100
• Hire ex-OpenAI / Anthropic / DeepMind infra engineers (budget $400K+ TC)
• Target inference cost at <$0.001 per 1K tokens to compete
• Build multi-cloud failover from Day 1 (AWS + GCP + Azure)
• Get SOC 2 Type II in first 6 months — enterprise won't talk without it

CRYPTO / WEB3 / DEFI
• Register in Dubai / Singapore / Cayman — India regulatory risk too high
• Hire ex-Binance / Coinbase compliance officer as first 10 employees
• Target 0.1% trading fee (Binance charges 0.1%, you need to match)
• Build fiat on-ramp with 3 local banks in target geography
• Launch referral program with 40% commission split — this is how Binance grew

LOGISTICS / WAREHOUSING / 3PL
• Lock 50,000 sqft warehouse in Bhiwandi/Manesar at ₹18–22/sqft
• Hire ex-Delhivery / Ecom Express ops managers who have done 10K+ orders/day
• Target 92% SLA adherence in Month 1 — Amazon won't onboard below this
• Build WMS integration with Unicommerce / Increff from Day 1
• Offer ₹12–15 per order for D2C brands (beat Shiprocket pricing)

FINTECH / LENDING / BNPL
• Get NBFC license or partner with existing NBFC (RBI approval takes 18+ months)
• Hire ex-Capital Float / Lendingkart credit risk heads
• Target 18–24% APR for prime borrowers (compete with banks)
• Build bureau-less underwriting for Tier-2/3 (Experian/CIBIL coverage is 40%)
• Launch ₹5,000–₹50,000 ticket size for first-time borrowers

HEALTHTECH / TELEMEDICINE
• Get teleconsultation guidelines compliance (MCI 2020 rules)
• Hire 50 MBBS doctors on retainer (₹800–1,200 per consultation)
• Partner with Apollo / Medanta for specialist referrals
• Launch ₹99 consultation + free delivery on first medicine order
• Target 35% repeat rate in Month 3 (industry avg 22%)

REAL ESTATE / PROPTECH
• Partner with 3 top builders in each city for exclusive inventory
• Hire ex-MagicBricks / 99acres sales managers who have done ₹100Cr+ GMV
• Launch virtual tours with 360° cameras — 2.5× higher conversion
• Offer 1% brokerage (industry standard 2%) to win volume
• Target ₹50L–₹1.5Cr ticket size (mass affluent sweet spot)

ELECTRIC VEHICLES / EV CHARGING
• Get FAME-II subsidy certification — ₹15K–50K per vehicle
• Partner with BPCL / HPCL for charging station co-location
• Hire ex-Ather / Ola Electric battery engineers
• Target ₹80,000–₹1.2L price point for 2-wheelers (mass market)
• Build battery swapping network in 3 cities before selling vehicles
"""

    def __init__(self, api_key: str = None):
        """
        api_key is kept for backwards compatibility but is no longer used directly.
        All LLM calls now go through utils.llm_client with automatic provider failover.
        """
        super().__init__()
        if not (
            os.getenv("GROQ_API_KEY")
            or os.getenv("DEEPSEEK_API_KEY")
            or os.getenv("OPENROUTER_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        ):
            raise ValueError(
                "No LLM providers configured. "
                "Set at least one of GROQ_API_KEY, DEEPSEEK_API_KEY, "
                "OPENROUTER_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY."
            )
        logger.info(f"[INIT] {self.name} ready with unified LLM client")

    def get_description(self) -> str:
        return "Generates hyper-specific, niche-aware action items for any startup vertical"

    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate industry-specific bullets based on the startup description.
        """
        startup_name = input_data.get('startupName') or input_data.get('startup_name', 'Unknown')
        idea_desc = input_data.get('ideaDescription') or input_data.get('idea_description', '')
        one_line = input_data.get('oneLineDescription') or input_data.get('one_line_description', '')
        industry = input_data.get('industry', '')
        business_model = input_data.get('businessModel') or input_data.get('business_model', '')
        target_market = input_data.get('targetMarket') or input_data.get('target_market', '')
        geography = input_data.get('geography', '')
        
        # Get idea profile from context if available
        idea_profile = context.get('idea_profile', {})
        category = idea_profile.get('category', industry)
        
        logger.info(f"[RUN] {self.name} processing startup: {startup_name}")
        logger.info(f"[CONTEXT] Category from idea_profile: {category}")
        logger.info(f"[CONTEXT] Idea description length: {len(idea_desc)} chars")

        try:
            prompt = self._build_prompt(
                startup_name=startup_name,
                one_line=one_line,
                idea_desc=idea_desc,
                industry=industry,
                category=category,
                business_model=business_model,
                target_market=target_market,
                geography=geography,
            )

            schema_instruction = """
CRITICAL: Output ONLY a valid JSON object. No markdown, no code fences, no explanation.

SCHEMA:
{
  "industry_label": "string (the specific niche you identified, e.g., 'Quick Commerce', 'Tier-2 Wedding Planning')",
  "bullets": ["string", "string", ...],
  "confidence": "high | medium | low"
}

The bullets array must contain 5-8 hyper-specific action items. Each bullet must:
- Start with a verb or specific target
- Include concrete numbers, names, or metrics
- Reference real platforms, certifications, or industry players
- NEVER use generic phrases like "optimize operations" or "hire key roles"
"""

            logger.info("[CALL] Calling unified LLM client for industry-specific bullets...")
            raw_text = llm_client.generate(
                prompt,
                temperature=0.3,  # Slightly higher for creative specificity
                max_output_tokens=1024,
                schema_instruction=schema_instruction,
            )

            logger.info(f"[RAW RESPONSE] {raw_text[:500]}...")
            
            result = self._parse_response(raw_text, input_data)
            
            logger.info(f"[OUTPUT] Generated {len(result.get('bullets', []))} industry-specific bullets")
            self.log_output(result)
            return result

        except Exception as e:
            logger.error(f"[ERROR] {self.name} failed with exception: {str(e)}")
            logger.error(f"[FALLBACK] Using heuristic-based fallback")
            return self._get_fallback_output(input_data, context)

    def _build_prompt(
        self,
        startup_name: str,
        one_line: str,
        idea_desc: str,
        industry: str,
        category: str,
        business_model: str,
        target_market: str,
        geography: str,
    ) -> str:
        """Build the full prompt with few-shot examples."""
        
        return f"""You are a brutally specific industry VC with 15+ years and 200+ deals in niche verticals.

Your only job: take the startup idea and output 5–8 hyper-specific bullets that actually matter in this exact industry in 2025 (India/global context as appropriate).

NEVER use generic words like:
- "operational efficiency"
- "hire key roles"
- "optimize unit economics"
- "build strong team"
- "focus on growth"
- "improve margins"

Instead, output SPECIFIC:
- Platform names (Meesho, TikTok Shop, BigBasket, etc.)
- Price points (₹4,999/month, $2.20 landed cost, etc.)
- Certifications (FSSAI, RCI license, SOC 2 Type II, etc.)
- Government schemes (PM-KISAN, FAME-II, iDEX, Make-II, etc.)
- Specific roles (ex-Swiggy fleet manager, ex-boAt PM, etc.)
- Concrete metrics (40% margin, 92% SLA, 1,000 users in 30 days, etc.)

EXAMPLES — pattern-match perfectly, never repeat verbatim:

{self.FEW_SHOT_EXAMPLES}

---

NOW ANALYZE THIS STARTUP:

Startup Name: {startup_name}
One-liner: {one_line}
Full Description: {idea_desc}
Industry: {industry}
Category: {category}
Business Model: {business_model}
Target Market: {target_market}
Geography: {geography}

Output 5-8 hyper-specific bullets for THIS exact niche. Be as specific as the examples above.
Think: what would a 15-year veteran VC in this EXACT vertical tell this founder in their first meeting?

Output format: JSON only with "industry_label", "bullets" array, and "confidence"."""

    def _parse_response(self, response_text: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse JSON response with hardened extraction."""
        try:
            clean_text = response_text.strip()
            
            # Remove markdown code fences
            if "```json" in clean_text:
                clean_text = re.sub(r'```json\s*', '', clean_text)
                clean_text = re.sub(r'```\s*$', '', clean_text)
            elif "```" in clean_text:
                clean_text = re.sub(r'```\s*', '', clean_text)
            
            # Find JSON object
            start_idx = clean_text.find('{')
            end_idx = clean_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                clean_text = clean_text[start_idx:end_idx+1]
            
            parsed = json.loads(clean_text)
            
            # Validate required fields
            if 'bullets' not in parsed or not isinstance(parsed['bullets'], list):
                raise ValueError("Missing or invalid 'bullets' field")
            
            # Ensure we have the right structure
            result = {
                "industry_label": parsed.get("industry_label", "General"),
                "bullets": parsed.get("bullets", [])[:8],  # Cap at 8 bullets
                "confidence": parsed.get("confidence", "medium"),
            }
            
            # Filter out any generic bullets that slipped through
            result["bullets"] = self._filter_generic_bullets(result["bullets"])
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"[JSON PARSE ERROR] Failed to parse JSON: {str(e)}")
            # Try to extract bullets from plain text
            return self._extract_bullets_from_text(response_text, input_data)
        except Exception as e:
            logger.error(f"[PARSE ERROR] Unexpected error: {str(e)}")
            raise

    def _filter_generic_bullets(self, bullets: List[str]) -> List[str]:
        """Remove any bullets that are too generic."""
        generic_phrases = [
            "operational efficiency",
            "optimize operations",
            "hire key roles",
            "build strong team",
            "focus on growth",
            "improve margins",
            "unit economics",
            "scale the business",
            "customer acquisition",
            "market research",
            "competitive analysis",
            "strategic partnerships",
        ]
        
        filtered = []
        for bullet in bullets:
            bullet_lower = bullet.lower()
            is_generic = any(phrase in bullet_lower for phrase in generic_phrases)
            if not is_generic and len(bullet) > 20:  # Also filter very short bullets
                filtered.append(bullet)
        
        return filtered if filtered else bullets[:5]  # Fallback to original if all filtered

    def _extract_bullets_from_text(self, text: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract bullet points from plain text response."""
        lines = text.split('\n')
        bullets = []
        
        for line in lines:
            line = line.strip()
            # Look for bullet-like patterns
            if line.startswith('•') or line.startswith('-') or line.startswith('*'):
                bullet = line.lstrip('•-* ').strip()
                if len(bullet) > 20:
                    bullets.append(bullet)
            elif re.match(r'^\d+\.', line):
                bullet = re.sub(r'^\d+\.\s*', '', line).strip()
                if len(bullet) > 20:
                    bullets.append(bullet)
        
        if bullets:
            return {
                "industry_label": input_data.get("industry", "General"),
                "bullets": bullets[:8],
                "confidence": "medium",
            }
        
        # Complete fallback
        return self._get_fallback_output(input_data, {})

    def _get_fallback_output(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback bullets based on industry keywords."""
        industry = (input_data.get("industry") or "").lower()
        idea_desc = (input_data.get("ideaDescription") or input_data.get("idea_description", "")).lower()
        all_text = f"{industry} {idea_desc}".lower()
        
        # Industry-specific fallbacks
        if any(k in all_text for k in ["saas", "software", "platform", "b2b"]):
            return {
                "industry_label": "B2B SaaS",
                "bullets": [
                    "Target 10 design partners in first 60 days with free pilots",
                    "Hire ex-Salesforce / HubSpot AEs who have closed $100K+ deals",
                    "Price at $499–$999/month for SMB tier (sweet spot for self-serve)",
                    "Build Slack / Teams integration in Week 1 — 80% of buyers expect this",
                    "Get SOC 2 Type II started immediately — enterprise won't talk without it",
                ],
                "confidence": "low",
            }
        elif any(k in all_text for k in ["ecommerce", "d2c", "retail", "fashion"]):
            return {
                "industry_label": "D2C E-commerce",
                "bullets": [
                    "Launch on Amazon + Flipkart first — 70% of discovery happens there",
                    "Target 35–40% gross margin after marketplace commission",
                    "Get 50 micro-influencers (10K–50K followers) on affiliate commission",
                    "Build WhatsApp catalog for repeat orders — 40% cheaper than ads",
                    "Offer COD in Tier-2/3 cities — 65% of orders are COD outside metros",
                ],
                "confidence": "low",
            }
        elif any(k in all_text for k in ["food", "restaurant", "delivery", "cloud kitchen"]):
            return {
                "industry_label": "Food / Cloud Kitchen",
                "bullets": [
                    "Lock kitchen space at ₹15–25/sqft in industrial areas",
                    "Launch on Swiggy + Zomato with 0% commission deals for first 30 days",
                    "Target 55–60% food cost (industry avg is 65%)",
                    "Build 3 virtual brands from same kitchen to maximize orders",
                    "Hire ex-Rebel Foods / Box8 ops managers who have done 500+ orders/day",
                ],
                "confidence": "low",
            }
        elif any(k in all_text for k in ["health", "medical", "clinic", "doctor", "therapy"]):
            return {
                "industry_label": "Healthcare / Clinic",
                "bullets": [
                    "Get all required medical licenses (state medical council) in first 30 days",
                    "Hire doctors with 5+ years experience and existing patient base",
                    "Price consultations at ₹500–₹1,000 (sweet spot for urban middle class)",
                    "Partner with diagnostic labs for 20–30% commission on referrals",
                    "Launch Google My Business + Practo listing immediately — 60% discovery",
                ],
                "confidence": "low",
            }
        elif any(k in all_text for k in ["fintech", "payment", "lending", "banking"]):
            return {
                "industry_label": "FinTech",
                "bullets": [
                    "Partner with existing NBFC or get RBI license (18+ months timeline)",
                    "Hire ex-Capital Float / Lendingkart risk officers",
                    "Target 18–24% APR for prime segment (compete with banks)",
                    "Build bureau-less underwriting for Tier-2/3 (40% uncovered by CIBIL)",
                    "Get PCI-DSS compliance before handling any card data",
                ],
                "confidence": "low",
            }
        else:
            return {
                "industry_label": "General Startup",
                "bullets": [
                    "Identify 3 specific distribution channels where your target customers already are",
                    "Lock 10 beta customers with signed LOIs before building v2",
                    "Hire one domain expert who has 10+ years in this exact vertical",
                    "Target specific unit economics: CAC < 3-month LTV payback",
                    "Build one integration with the tool your customers already use daily",
                ],
                "confidence": "low",
            }

