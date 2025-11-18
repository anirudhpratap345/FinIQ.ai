"""
Raise Amount Agent
Recommends how much capital to raise based on stage and needs.
"""

import os
import json
import logging
from typing import Dict, Any
import google.generativeai as genai

from .base_agent import BaseAgent
from utils.prompt_templates import PromptTemplates

logger = logging.getLogger(__name__)


class RaiseAmountAgent(BaseAgent):
    """
    Calculates recommended funding amount based on:
    - Funding stage
    - Team size & hiring needs
    - Industry requirements
    - Runway goals
    """
    
    def __init__(self, api_key: str = None):
        super().__init__()
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY not found in environment")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        logger.info(f"[INIT] {self.name} ready")
    
    def get_description(self) -> str:
        return "Recommends optimal funding amount based on stage, team, and runway needs"
    
    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate recommended raise amount.
        
        Requires context["funding_stage"] from FundingStageAgent and 
        context["idea_profile"] from IdeaUnderstandingAgent.
        """
        startup_name = input_data.get('startupName') or input_data.get('startup_name', 'Unknown')
        logger.info(f"[RUN] {self.name} processing startup: {startup_name}")
        
        # Log context fields received
        logger.info(f"[CONTEXT] Received context keys: {list(context.keys())}")
        idea_profile = context.get('idea_profile') or context.get('ideaProfile')
        funding_stage_data = context.get("funding_stage", {})
        funding_stage = funding_stage_data.get("funding_stage", "Seed")
        
        if idea_profile:
            logger.info(f"[CONTEXT] Idea profile - capital_intensity: {idea_profile.get('capital_intensity')}, burn_profile: {idea_profile.get('burn_profile')}")
        else:
            logger.warning(f"[CONTEXT] No idea_profile found in context")
        
        logger.info(f"[CONTEXT] Previous funding stage: {funding_stage}")
        
        try:
            # Generate prompt
            prompt = PromptTemplates.raise_amount_agent(input_data, funding_stage)
            
            # Call Gemini
            logger.info(f"[CALL] Calling Gemini API...")
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.4,
                    "top_p": 0.8,
                    "max_output_tokens": 1536,
                }
            )
            
            result = self._parse_response(response.text)
            logger.info(f"[OUTPUT] Recommended amount: {result.get('recommended_amount')}")
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
        
        required_fields = ["recommended_amount", "rationale"]
        for field in required_fields:
            if field not in parsed:
                raise ValueError(f"Missing required field: {field}")
        
        return parsed
    
    def _get_fallback_output(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback heuristic for raise amount."""
        stage = context.get("funding_stage", {}).get("funding_stage", "Seed")
        
        # Stage-based defaults
        stage_amounts = {
            "Idea": "$50K-$150K",
            "Pre-Seed": "$150K-$500K",
            "Seed": "$500K-$2M",
            "Series A": "$2M-$10M",
            "Series B+": "$10M+"
        }
        
        amount = stage_amounts.get(stage, "$500K-$1M")
        
        return {
            "recommended_amount": amount,
            "minimum_viable": "50% of recommended",
            "optimal_amount": amount,
            "rationale": f"Typical range for {stage} stage (fallback)",
            "breakdown": {
                "team_expansion": "40%",
                "product_development": "30%",
                "marketing_sales": "20%",
                "operations_overhead": "10%",
                "buffer": "reserve"
            }
        }

