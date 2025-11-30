"""
Investor Type Agent
Identifies ideal investor profiles for the startup.
"""

import os
import json
import logging
from typing import Dict, Any

from .base_agent import BaseAgent
from utils.prompt_templates import PromptTemplates
from utils.llm_client import llm_client

logger = logging.getLogger(__name__)


class InvestorTypeAgent(BaseAgent):
    """
    Recommends investor types based on:
    - Funding stage
    - Raise amount
    - Industry & geography
    - Business model
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
        return "Identifies optimal investor types and approach strategies"
    
    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Identify ideal investor types.
        
        Requires:
        - context["funding_stage"]
        - context["raise_amount"]
        - context["idea_profile"]
        """
        startup_name = input_data.get('startupName') or input_data.get('startup_name', 'Unknown')
        logger.info(f"[RUN] {self.name} processing startup: {startup_name}")
        
        # Log context fields received
        logger.info(f"[CONTEXT] Received context keys: {list(context.keys())}")
        idea_profile = context.get('idea_profile') or context.get('ideaProfile')
        funding_stage = context.get("funding_stage", {}).get("funding_stage", "Seed")
        raise_amount = context.get("raise_amount", {}).get("recommended_amount", "$500K")
        
        if idea_profile:
            logger.info(f"[CONTEXT] Idea profile - category: {idea_profile.get('category')}, regulation_risk: {idea_profile.get('regulation_risk')}")
        else:
            logger.warning(f"[CONTEXT] No idea_profile found in context")
        
        logger.info(f"[CONTEXT] Funding stage: {funding_stage}, Raise amount: {raise_amount}")
        
        try:
            prompt = PromptTemplates.investor_type_agent(input_data, funding_stage, raise_amount)
            
            logger.info("[CALL] Calling unified LLM client...")
            raw_text = llm_client.generate(
                prompt,
                temperature=0.5,
                max_output_tokens=1536,
            )
            
            result = self._parse_response(raw_text)
            logger.info(f"[OUTPUT] Primary investor type: {result.get('primary_investor_type')}")
            self.log_output(result)
            return result
            
        except Exception as e:
            logger.error(f"[ERROR] {self.name} failed: {str(e)}")
            return self._get_fallback_output(context)
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate response."""
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text.replace("```json", "").replace("```", "").strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text.replace("```", "").strip()
        
        parsed = json.loads(clean_text)
        
        required_fields = ["primary_investor_type", "rationale"]
        for field in required_fields:
            if field not in parsed:
                raise ValueError(f"Missing required field: {field}")
        
        return parsed
    
    def _get_fallback_output(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback investor recommendations."""
        stage = context.get("funding_stage", {}).get("funding_stage", "Seed")
        
        stage_investors = {
            "Idea": "Friends & Family, Angel Investors",
            "Pre-Seed": "Angel Investors, Pre-Seed VCs, Accelerators",
            "Seed": "Seed VCs, Angel Networks, Micro VCs",
            "Series A": "Institutional VCs, Growth Funds",
            "Series B+": "Late-Stage VCs, Private Equity"
        }
        
        primary = stage_investors.get(stage, "Seed VCs")
        
        return {
            "primary_investor_type": primary,
            "secondary_options": ["Accelerators", "Angel Investors"],
            "avoid": ["Investors not aligned with stage"],
            "rationale": f"Typical investor profile for {stage} stage",
            "target_profile": "Industry-focused, stage-appropriate investors",
            "approach_strategy": "Warm intros, demo day, targeted outreach"
        }

