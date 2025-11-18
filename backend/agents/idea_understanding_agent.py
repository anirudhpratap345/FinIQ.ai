"""
Idea Understanding Agent
Builds a structured profile of the startup idea that downstream agents can use.
"""

import os
import json
import logging
from typing import Dict, Any
import google.generativeai as genai

from .base_agent import BaseAgent
from utils.prompt_templates import PromptTemplates

logger = logging.getLogger(__name__)


class IdeaUnderstandingAgent(BaseAgent):
    """
    Reads the full startup idea description and derives a structured profile, e.g.:
    - category (e.g., "AI Infrastructure", "Fintech SaaS")
    - business_model (e.g., "Usage-based GPU compute")
    - capital_intensity (Low/Medium/High/Very High)
    - burn_profile (Low/Medium/High)
    - hardware_dependency (Low/Medium/High)
    - operational_complexity (Low/Medium/High)
    - regulation_risk (Low/Medium/High)
    - scalability_model (short text)
    - margin_profile (Low/Medium/High)
    - team_requirements (list of key roles)
    """

    def __init__(self, api_key: str = None):
        super().__init__()
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY not found in environment")

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
        logger.info(f"[INIT] {self.name} ready")

    def get_description(self) -> str:
        return "Understands the startup idea and derives a structured domain/economic profile"

    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build idea profile from the ideaDescription and related fields.
        """
        logger.info(f"[RUN] {self.name} processing startup: {input_data.get('startupName')}")

        try:
            prompt = PromptTemplates.idea_understanding_agent(input_data)

            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,
                    "top_p": 0.8,
                    "max_output_tokens": 1024,
                },
            )

            result = self._parse_response(response.text)
            self.log_output(result)
            return result

        except Exception as e:
            logger.error(f"[ERROR] {self.name} failed: {str(e)}")
            # Fall back to a minimal profile using existing fields
            return self._get_fallback_output(input_data)

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON response and ensure core fields exist."""
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text.replace("```json", "").replace("```", "").strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text.replace("```", "").strip()

        parsed = json.loads(clean_text)

        # Ensure a few core keys exist; rest are optional
        if "category" not in parsed:
            parsed["category"] = "General"
        if "business_model" not in parsed:
            parsed["business_model"] = input_or_default(parsed, "business_model", "Not specified")
        if "capital_intensity" not in parsed:
            parsed["capital_intensity"] = "Medium"

        return parsed

    def _get_fallback_output(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simple heuristic-based fallback profile."""
        industry = input_data.get("industry", "General")
        business_model = input_data.get("businessModel", "Not specified")

        # Very lightweight heuristic just to avoid breaking the chain
        capital_intensity = "Medium"
        if any(k in industry.lower() for k in ["infrastructure", "hardware", "gpu", "semiconductor"]):
            capital_intensity = "High"

        return {
            "category": industry,
            "business_model": business_model,
            "capital_intensity": capital_intensity,
            "burn_profile": "Medium",
            "hardware_dependency": "Medium",
            "operational_complexity": "Medium",
            "regulation_risk": "Medium",
            "scalability_model": "Not specified",
            "margin_profile": "Medium",
            "team_requirements": [],
        }


def input_or_default(parsed: Dict[str, Any], key: str, default: str) -> str:
    value = parsed.get(key)
    if isinstance(value, str) and value.strip():
        return value
    return default


