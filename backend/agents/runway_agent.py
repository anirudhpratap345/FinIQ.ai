"""
Runway Agent
Calculates expected runway and burn rate guidance.
"""

import os
import json
import logging
from typing import Dict, Any

from .base_agent import BaseAgent
from utils.prompt_templates import PromptTemplates
from utils.llm_client import llm_client

logger = logging.getLogger(__name__)


class RunwayAgent(BaseAgent):
    """
    Estimates runway based on:
    - Raise amount
    - Team size
    - Industry costs
    - Revenue (if any)
    """
    
    def __init__(self, api_key: str = None):
        """
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
        return "Calculates runway and provides burn rate management guidance"
    
    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate runway and burn rate.
        
        Requires context["raise_amount"] and context["idea_profile"].
        """
        startup_name = input_data.get('startupName') or input_data.get('startup_name', 'Unknown')
        logger.info(f"[RUN] {self.name} processing startup: {startup_name}")
        
        # Log context fields received
        logger.info(f"[CONTEXT] Received context keys: {list(context.keys())}")
        idea_profile = context.get('idea_profile') or context.get('ideaProfile')
        raise_amount = context.get("raise_amount", {}).get("optimal_amount", "$500K")
        
        if idea_profile:
            logger.info(f"[CONTEXT] Idea profile - burn_profile: {idea_profile.get('burn_profile')}, operational_complexity: {idea_profile.get('operational_complexity')}")
        else:
            logger.warning(f"[CONTEXT] No idea_profile found in context")
        
        logger.info(f"[CONTEXT] Raise amount: {raise_amount}")
        
        try:
            prompt = PromptTemplates.runway_agent(input_data, raise_amount)
            
            logger.info("[CALL] Calling unified LLM client...")
            raw_text = llm_client.generate(
                prompt,
                temperature=0.3,
                max_output_tokens=1536,
            )
            
            result = self._parse_response(raw_text)
            logger.info(f"[OUTPUT] Runway: {result.get('estimated_runway_months')} months, Burn: {result.get('monthly_burn_rate')}")
            self.log_output(result)
            return result
            
        except Exception as e:
            logger.error(f"[ERROR] {self.name} failed: {str(e)}")
            return self._get_fallback_output(input_data, context)
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate response."""
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text.replace("```json", "").replace("```", "").strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text.replace("```", "").strip()
        
        parsed = json.loads(clean_text)
        
        required_fields = ["estimated_runway_months", "monthly_burn_rate"]
        for field in required_fields:
            if field not in parsed:
                raise ValueError(f"Missing required field: {field}")
        
        return parsed
    
    def _get_fallback_output(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback runway calculation."""
        team_size = input_data.get("teamSize", 3)
        monthly_revenue = input_data.get("monthlyRevenue", 0)
        
        # Simple burn calculation: $10K/person + $20K overhead
        estimated_burn = (team_size * 10000) + 20000
        net_burn = max(estimated_burn - monthly_revenue, 5000)
        
        # Assume raise of $500K default
        raise_str = context.get("raise_amount", {}).get("optimal_amount", "$500K")
        # Extract number (rough)
        import re
        amounts = re.findall(r'\$?([\d,]+)K', raise_str)
        raise_k = float(amounts[0].replace(',', '')) if amounts else 500
        raise_amount = raise_k * 1000
        
        runway_months = int(raise_amount / net_burn)
        
        return {
            "estimated_runway_months": f"{runway_months}-{runway_months+3}",
            "monthly_burn_rate": f"${int(net_burn/1000)}K",
            "assumptions": {
                "team_costs": f"${team_size * 10}K",
                "operational_expenses": "$20K",
                "growth_investments": "Variable"
            },
            "revenue_impact": f"${int(monthly_revenue)} MRR offsets burn",
            "key_milestones": ["Achieve product-market fit", "Reach next funding stage"],
            "burn_rate_guidance": "Monitor closely, optimize hiring pace"
        }

