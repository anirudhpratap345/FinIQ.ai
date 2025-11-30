"""
Idea Understanding Agent
Builds a structured profile of the startup idea that downstream agents can use.
"""

import os
import json
import re
import logging
from typing import Dict, Any

from .base_agent import BaseAgent
from utils.prompt_templates import PromptTemplates
from utils.llm_client import llm_client

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
    - confidence (low/medium/high) - based on quality of input
    """

    def __init__(self, api_key: str = None):
        """
        api_key is kept for backwards compatibility but is no longer used directly.
        All LLM calls now go through utils.llm_client with automatic provider failover.
        """
        super().__init__()
        # We still enforce that at least one provider is configured for clarity.
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
        return "Understands the startup idea and derives a structured domain/economic profile"

    def run(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build idea profile from the ideaDescription and related fields.
        """
        startup_name = input_data.get('startupName') or input_data.get('startup_name', 'Unknown')
        idea_desc = input_data.get('ideaDescription') or input_data.get('idea_description', '')
        
        logger.info(f"[RUN] {self.name} processing startup: {startup_name}")
        logger.info(f"[CONTEXT] Received input fields: {list(input_data.keys())}")
        logger.info(f"[CONTEXT] Idea description length: {len(idea_desc)} chars")

        try:
            prompt = PromptTemplates.idea_understanding_agent(input_data)

            # Strong schema enforcement for idea_profile JSON
            schema_instruction = """
CRITICAL: Output ONLY a valid JSON object matching this EXACT schema. No other text, no markdown (no ```json), no explanations. Use ALL details from the input to derive precise, non-generic values. If uncertain, explain briefly in "notes" but NEVER use defaults like "Medium" without rationale.

SCHEMA:
{
  "category": "string (precise sub-industry, e.g., 'PropTech FinTech', not 'General')",
  "business_model": "string (specific, e.g., 'Per-shipment + subscription')",
  "capital_intensity": "string (Low/Medium/High/Very High, justified by hardware/logistics needs)",
  "burn_profile": "string (Low/Medium/High, based on ops/compliance burn)",
  "hardware_dependency": "string (Low/Medium/High, e.g., High for IoT sensors/dewars)",
  "operational_complexity": "string (Low/Medium/High, factoring regulation/partnerships)",
  "regulation_risk": "string (Low/Medium/High/Very High, e.g., Very High for FDA/pharma shipping)",
  "scalability_model": "string (brief, e.g., 'Network effects via pharma partnerships')",
  "margin_profile": "string (Low/Medium/High, e.g., High post-scale due to recurring fees)",
  "team_requirements": "array of strings (3-5 key roles, e.g., ['Chief Quality Officer', 'Logistics Engineer'])",
  "confidence": "string (low/medium/high, high if input is detailed)",
  "notes": "string (1-2 sentences on key risks/opportunities)"
}
"""

            logger.info("[CALL] Calling unified LLM client for idea understanding (schema-enforced)...")
            raw_text = llm_client.generate(
                prompt,
                temperature=0.1,
                max_output_tokens=1024,
                schema_instruction=schema_instruction,
            )

            # Log raw response BEFORE parsing
            logger.info(f"[RAW RESPONSE] {raw_text[:500]}...")
            
            result = self._parse_response(raw_text, input_data)
            
            logger.info(f"[OUTPUT] Successfully parsed idea profile: category={result.get('category')}, confidence={result.get('confidence')}")
            self.log_output(result)
            return result
 
        except Exception as e:
            logger.error(f"[ERROR] {self.name} failed with exception: {str(e)}")
            logger.error(f"[FALLBACK] Using heuristic-based fallback profile")
            # Fall back to a minimal profile using existing fields
            return self._get_fallback_output(input_data)

    def _parse_response(self, response_text: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse JSON response with hardened extraction.
        Strips markdown, removes code fences, attempts JSON repair.
        """
        try:
            clean_text = response_text.strip()
            
            # Remove markdown code fences (```json ... ```)
            if "```json" in clean_text:
                clean_text = re.sub(r'```json\s*', '', clean_text)
                clean_text = re.sub(r'```\s*$', '', clean_text)
            elif "```" in clean_text:
                clean_text = re.sub(r'```\s*', '', clean_text)
            
            # Remove any leading/trailing non-JSON text
            # Find first { and last }
            start_idx = clean_text.find('{')
            end_idx = clean_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                clean_text = clean_text[start_idx:end_idx+1]
            
            # Attempt to parse
            parsed = json.loads(clean_text)
            
            # Validate and fill required fields
            parsed = self._validate_and_fill_fields(parsed, input_data)
            
            return parsed
            
        except json.JSONDecodeError as e:
            logger.error(f"[JSON PARSE ERROR] Failed to parse JSON: {str(e)}")
            logger.error(f"[JSON PARSE ERROR] Cleaned text was: {clean_text[:300]}...")
            # Attempt basic JSON repair (e.g., trailing commas, missing quotes)
            try:
                repaired = self._attempt_json_repair(clean_text)
                parsed = json.loads(repaired)
                parsed = self._validate_and_fill_fields(parsed, input_data)
                logger.info(f"[JSON REPAIR] Successfully repaired and parsed JSON")
                return parsed
            except:
                logger.error(f"[JSON REPAIR] Repair failed, using fallback")
                raise
        except Exception as e:
            logger.error(f"[PARSE ERROR] Unexpected error during parsing: {str(e)}")
            raise

    def _attempt_json_repair(self, text: str) -> str:
        """
        Attempt basic JSON repair strategies.
        """
        # Remove trailing commas before } or ]
        text = re.sub(r',\s*}', '}', text)
        text = re.sub(r',\s*]', ']', text)
        return text

    def _validate_and_fill_fields(self, parsed: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure all required fields exist with valid values.
        """
        # Required fields with defaults
        defaults = {
            "category": "General",
            "business_model": "Not specified",
            "capital_intensity": "Medium",
            "burn_profile": "Medium",
            "hardware_dependency": "Medium",
            "operational_complexity": "Medium",
            "regulation_risk": "Medium",
            "scalability_model": "Not specified",
            "margin_profile": "Medium",
            "team_requirements": [],
            "confidence": "medium",
            "notes": ""
        }
        
        for key, default_value in defaults.items():
            if key not in parsed or not parsed[key]:
                parsed[key] = default_value
        
        return parsed

    def _get_fallback_output(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Industry-aware heuristic fallback profile.
        Returns more intelligent defaults based on industry/description keywords.
        """
        industry = (input_data.get("industry") or "").lower()
        business_model = input_data.get("businessModel") or input_data.get("business_model", "Not specified")
        idea_desc = (input_data.get("ideaDescription") or input_data.get("idea_description", "")).lower()
        startup_name = (input_data.get("startupName") or input_data.get("startup_name", "")).lower()
        
        # Combine all text for keyword analysis
        all_text = f"{industry} {idea_desc} {startup_name} {business_model}".lower()
        
        # Smart heuristics based on keywords
        capital_intensity = "Medium"
        burn_profile = "Medium"
        hardware_dependency = "Low"
        operational_complexity = "Medium"
        regulation_risk = "Low"
        margin_profile = "Medium"
        team_requirements = ["Founders", "Engineers", "Sales"]
        category = industry.title() if industry else "General"
        
        # GPU / Infrastructure / Computing
        if any(k in all_text for k in ["gpu", "infra", "computing", "cloud", "hardware", "semiconductor", "chip"]):
            capital_intensity = "Very High"
            burn_profile = "High"
            hardware_dependency = "Very High"
            operational_complexity = "High"
            margin_profile = "Medium"
            team_requirements = ["Infrastructure Engineers", "DevOps", "Hardware Engineers", "Sales Engineers"]
            category = "Infrastructure / Hardware"
        
        # Food / Logistics / Delivery
        elif any(k in all_text for k in ["food", "delivery", "logistics", "restaurant", "grocery", "shipping"]):
            capital_intensity = "High"
            burn_profile = "High"
            hardware_dependency = "Low"
            operational_complexity = "Very High"
            regulation_risk = "Medium"
            margin_profile = "Low"
            team_requirements = ["Operations", "Logistics Managers", "Drivers", "Customer Support"]
            category = "Food / Logistics"
        
        # SaaS / Software
        elif any(k in all_text for k in ["saas", "software", "platform", "app", "web", "digital"]):
            capital_intensity = "Low"
            burn_profile = "Medium"
            hardware_dependency = "Low"
            operational_complexity = "Low"
            regulation_risk = "Low"
            margin_profile = "High"
            team_requirements = ["Software Engineers", "Product Managers", "Sales", "Marketing"]
            category = "SaaS / Software"
        
        # FinTech / Finance
        elif any(k in all_text for k in ["fintech", "finance", "banking", "payment", "lending", "trading", "crypto"]):
            capital_intensity = "Medium"
            burn_profile = "Medium"
            hardware_dependency = "Low"
            operational_complexity = "High"
            regulation_risk = "Very High"
            margin_profile = "Medium"
            team_requirements = ["Engineers", "Compliance Officers", "Financial Analysts", "Risk Managers"]
            category = "FinTech"
        
        # Healthcare / BioTech
        elif any(k in all_text for k in ["health", "medical", "biotech", "pharma", "clinical", "patient"]):
            capital_intensity = "High"
            burn_profile = "Medium"
            hardware_dependency = "Medium"
            operational_complexity = "Very High"
            regulation_risk = "Very High"
            margin_profile = "High"
            team_requirements = ["Scientists", "Clinicians", "Regulatory Experts", "Engineers"]
            category = "Healthcare / BioTech"
        
        # E-commerce / Marketplace
        elif any(k in all_text for k in ["ecommerce", "marketplace", "retail", "shopping", "commerce"]):
            capital_intensity = "Medium"
            burn_profile = "High"
            hardware_dependency = "Low"
            operational_complexity = "Medium"
            regulation_risk = "Low"
            margin_profile = "Low"
            team_requirements = ["Engineers", "Marketing", "Operations", "Customer Support"]
            category = "E-commerce / Marketplace"
        
        logger.info(f"[FALLBACK] Using intelligent fallback: category={category}, capital_intensity={capital_intensity}")
        
        return {
            "category": category,
            "business_model": business_model,
            "capital_intensity": capital_intensity,
            "burn_profile": burn_profile,
            "hardware_dependency": hardware_dependency,
            "operational_complexity": operational_complexity,
            "regulation_risk": regulation_risk,
            "scalability_model": "Standard for category",
            "margin_profile": margin_profile,
            "team_requirements": team_requirements,
            "confidence": "low",  # Mark fallback with low confidence
            "notes": "Generated using fallback heuristics due to parsing failure"
        }


