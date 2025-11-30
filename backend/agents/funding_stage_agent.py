"""
Funding Stage Agent
Determines the appropriate funding stage for a startup.
"""

import os
import json
import logging
from typing import Dict, Any

from .base_agent import BaseAgent
from utils.prompt_templates import PromptTemplates
from utils.llm_client import llm_client

logger = logging.getLogger(__name__)


class FundingStageAgent(BaseAgent):
    """
    Analyzes startup profile to determine funding stage.
    
    Stages: Idea, Pre-Seed, Seed, Series A, Series B+, Bootstrapped/Profitable
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize the FundingStageAgent.

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
        return "Analyzes startup metrics to determine appropriate funding stage"
    
    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute funding stage analysis.
        
        Args:
            input_data: Validated startup input
            context: Shared context (contains idea_profile from IdeaUnderstandingAgent)
            
        Returns:
            {
                "funding_stage": str,
                "confidence": str,
                "rationale": str,
                "stage_characteristics": str
            }
        """
        startup_name = input_data.get('startupName') or input_data.get('startup_name', 'Unknown')
        logger.info(f"[RUN] {self.name} processing startup: {startup_name}")
        
        # Log context fields received
        idea_profile = context.get('idea_profile') or context.get('ideaProfile')
        logger.info(f"[CONTEXT] Received context keys: {list(context.keys())}")
        if idea_profile:
            logger.info(f"[CONTEXT] Idea profile category: {idea_profile.get('category')}, confidence: {idea_profile.get('confidence')}")
        else:
            logger.warning(f"[CONTEXT] No idea_profile found in context")
        
        try:
            # Generate prompt
            prompt = PromptTemplates.funding_stage_agent(input_data)
            
            # Call unified LLM client
            logger.info("[CALL] Calling unified LLM client...")
            raw_text = llm_client.generate(
                prompt,
                temperature=0.3,
                max_output_tokens=1024,
            )
            
            # Parse response
            result = self._parse_response(raw_text)
            
            # Log output before returning
            logger.info(f"[OUTPUT] Funding stage: {result.get('funding_stage')}, confidence: {result.get('confidence')}")
            self.log_output(result)
            
            return result
            
        except Exception as e:
            logger.error(f"[ERROR] {self.name} failed: {str(e)}")
            # Return safe fallback
            return self._get_fallback_output(input_data)
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse and validate Gemini response.
        
        Args:
            response_text: Raw text from Gemini
            
        Returns:
            Parsed JSON dict
        """
        try:
            # Remove markdown code blocks if present
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text.replace("```json", "").replace("```", "").strip()
            elif clean_text.startswith("```"):
                clean_text = clean_text.replace("```", "").strip()
            
            # Parse JSON
            parsed = json.loads(clean_text)
            
            # Validate required fields
            required_fields = ["funding_stage", "confidence", "rationale"]
            for field in required_fields:
                if field not in parsed:
                    raise ValueError(f"Missing required field: {field}")
            
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"[PARSE ERROR] Invalid JSON: {response_text[:200]}")
            raise ValueError(f"Failed to parse AI response: {str(e)}")
    
    def _get_fallback_output(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide a safe fallback based on simple heuristics.
        
        Args:
            input_data: Startup input data
            
        Returns:
            Fallback funding stage recommendation
        """
        product_stage = input_data.get("productStage", "Idea")
        monthly_revenue = input_data.get("monthlyRevenue", 0)
        
        # Simple heuristic logic
        if product_stage == "Idea":
            stage = "Pre-Seed"
        elif product_stage == "MVP" and monthly_revenue < 1000:
            stage = "Pre-Seed"
        elif product_stage == "Beta" or (product_stage == "Revenue" and monthly_revenue < 10000):
            stage = "Seed"
        elif monthly_revenue > 50000:
            stage = "Series A"
        else:
            stage = "Seed"
        
        return {
            "funding_stage": stage,
            "confidence": "low",
            "rationale": "Fallback recommendation based on product stage and revenue (AI analysis unavailable)",
            "stage_characteristics": "Basic heuristic applied"
        }

