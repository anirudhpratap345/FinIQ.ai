"""
Financial Priority Agent
Identifies top financial priorities for the next 6-12 months.
"""

import os
import json
import logging
from typing import Dict, Any
import google.generativeai as genai

from .base_agent import BaseAgent
from utils.prompt_templates import PromptTemplates

logger = logging.getLogger(__name__)


class FinancialPriorityAgent(BaseAgent):
    """
    Synthesizes all previous outputs to recommend:
    - Top 3-5 financial priorities
    - Quick wins
    - What to avoid
    - Success metrics
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
        return "Synthesizes all analysis to define top financial priorities"
    
    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Define financial priorities.
        
        Uses full context from all previous agents including idea_profile.
        """
        startup_name = input_data.get('startupName') or input_data.get('startup_name', 'Unknown')
        logger.info(f"[RUN] {self.name} processing startup: {startup_name}")
        
        # Log context fields received
        logger.info(f"[CONTEXT] Received context keys: {list(context.keys())}")
        idea_profile = context.get('idea_profile') or context.get('ideaProfile')
        
        if idea_profile:
            logger.info(f"[CONTEXT] Idea profile - category: {idea_profile.get('category')}, team_requirements: {idea_profile.get('team_requirements')}")
        else:
            logger.warning(f"[CONTEXT] No idea_profile found in context")
        
        try:
            # Build context summary for prompt
            context_summary = {
                "funding_stage": context.get("funding_stage", {}).get("funding_stage", "N/A"),
                "raise_amount": context.get("raise_amount", {}).get("recommended_amount", "N/A"),
                "investor_type": context.get("investor_type", {}).get("primary_investor_type", "N/A"),
                "runway": context.get("runway", {}).get("estimated_runway_months", "N/A")
            }
            
            logger.info(f"[CONTEXT] Context summary: {context_summary}")
            
            prompt = PromptTemplates.financial_priority_agent(input_data, context_summary)
            
            logger.info(f"[CALL] Calling Gemini API...")
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.6,
                    "top_p": 0.9,
                    "max_output_tokens": 2048,
                }
            )
            
            result = self._parse_response(response.text)
            logger.info(f"[OUTPUT] Generated {len(result.get('priorities', []))} financial priorities")
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
        
        required_fields = ["priorities"]
        for field in required_fields:
            if field not in parsed:
                raise ValueError(f"Missing required field: {field}")
        
        return parsed
    
    def _get_fallback_output(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback priority recommendations."""
        stage = context.get("funding_stage", {}).get("funding_stage", "Seed")
        
        return {
            "priorities": [
                {
                    "priority": "Secure funding commitments",
                    "importance": "critical",
                    "rationale": "Primary focus to extend runway",
                    "timeline": "Next 2-3 months",
                    "estimated_cost": "Time investment"
                },
                {
                    "priority": "Optimize burn rate",
                    "importance": "high",
                    "rationale": "Extend runway and demonstrate capital efficiency",
                    "timeline": "Ongoing",
                    "estimated_cost": "Operational efficiency"
                },
                {
                    "priority": "Build investor pipeline",
                    "importance": "high",
                    "rationale": "Prepare for next funding round",
                    "timeline": "Next 6 months",
                    "estimated_cost": "Networking time"
                }
            ],
            "quick_wins": [
                "Review and cut unnecessary subscriptions",
                "Negotiate better rates with vendors",
                "Set up financial tracking dashboard"
            ],
            "avoid": [
                "Premature hiring",
                "Expensive office space",
                "Non-essential tools and services"
            ],
            "success_metrics": [
                "Monthly burn rate trend",
                "Investor meeting conversion rate",
                "Runway remaining"
            ]
        }

