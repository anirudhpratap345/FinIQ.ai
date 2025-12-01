"""
Chain Manager - Agent Orchestrator
Executes the financial agent chain sequentially and manages shared context.
"""

import logging
from typing import Dict, Any, List
from datetime import datetime

from agents import (
    FundingStageAgent,
    RaiseAmountAgent,
    InvestorTypeAgent,
    RunwayAgent,
    FinancialPriorityAgent,
    IdeaUnderstandingAgent,
    IndustrySpecialistAgent,
)
from utils import validate_startup_input, input_to_dict
from utils.cache import compute_hash, cache_get, cache_set

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class ChainManager:
    """
    Orchestrates the financial agent chain.
    
    Flow:
    1. Validate input
    2. Execute agents sequentially
    3. Build shared context
    4. Return consolidated output
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize the chain manager and all agents.
        
        Args:
            api_key: Gemini API key (passed to all agents)
        """
        logger.info("=" * 70)
        logger.info("[INIT] Initializing FinIQ.ai Agent Chain")
        logger.info("=" * 70)
        
        self.api_key = api_key
        self.context: Dict[str, Any] = {}
        self.execution_log: List[Dict[str, Any]] = []
        
        # Initialize all agents
        # Order: IdeaUnderstanding → IndustrySpecialist → FundingStage → RaiseAmount → InvestorType → Runway → FinancialPriority
        try:
            self.agents = [
                IdeaUnderstandingAgent(api_key=api_key),
                IndustrySpecialistAgent(api_key=api_key),  # NEW: Hyper-specific niche bullets
                FundingStageAgent(api_key=api_key),
                RaiseAmountAgent(api_key=api_key),
                InvestorTypeAgent(api_key=api_key),
                RunwayAgent(api_key=api_key),
                FinancialPriorityAgent(api_key=api_key)
            ]
            logger.info(f"[OK] Initialized {len(self.agents)} agents successfully")
        except Exception as e:
            logger.error(f"[FAIL] Failed to initialize agents: {str(e)}")
            raise
    
    def run(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete agent chain.
        
        Args:
            raw_input: Raw startup input from frontend
            
        Returns:
            Consolidated financial strategy report with 'cached' metadata
        """
        start_time = datetime.now()
        logger.info("\n" + "=" * 70)
        logger.info("[START] Starting FinIQ.ai Analysis")
        logger.info("=" * 70)
        
        try:
            # Step 1: Validate input
            logger.info("\n[STEP 1] Validating input data...")
            validated_input = validate_startup_input(raw_input)
            input_dict = input_to_dict(validated_input)

            # Normalize naming for descriptions so prompts can use a consistent shape
            input_dict["startup_name"] = input_dict.get("startupName", "")
            # Prefer an explicit one-line description if provided, otherwise fall back to the name
            input_dict["one_line_description"] = (
                input_dict.get("oneLineDescription")
                or input_dict.get("startupName", "")
            )
            # Prefer a dedicated ideaDescription; fall back to tractionSummary if needed
            input_dict["idea_description"] = (
                input_dict.get("ideaDescription")
                or input_dict.get("tractionSummary")
                or ""
            )

            logger.info(f"[OK] Input validated for: {input_dict['startupName']}")
            
            # Step 1.5: Check cache before executing agents
            logger.info("\n[CACHE CHECK] Computing cache key...")
            cache_key = compute_hash(input_dict)
            cached_result = cache_get(cache_key)
            
            if cached_result:
                # Cache hit - return immediately without calling agents
                execution_time = (datetime.now() - start_time).total_seconds()
                logger.info(f"[CACHE HIT] ⚡ Returning cached result in {execution_time:.3f}s")
                logger.info("=" * 70)
                
                # Add metadata to indicate this is cached
                cached_result["metadata"] = cached_result.get("metadata", {})
                cached_result["metadata"]["cached"] = True
                cached_result["metadata"]["cache_retrieval_time_seconds"] = execution_time
                cached_result["metadata"]["original_execution_time_seconds"] = cached_result["metadata"].get("execution_time_seconds", 0)
                
                return cached_result
            
            logger.info("[CACHE MISS] No cached result found, executing agent chain...")
            
            # Step 2: Execute agent chain
            logger.info("\n[STEP 2] Executing agent chain...")
            self.context = {"input": input_dict}
            
            for i, agent in enumerate(self.agents, 1):
                logger.info(f"\n--- Agent {i}/{len(self.agents)}: {agent.name} ---")
                
                try:
                    # Run agent
                    agent_output = agent.run(input_dict, self.context)
                    
                    # Store output in context
                    agent_key = self._get_agent_key(agent.name)
                    self.context[agent_key] = agent_output

                    # Make idea understanding profile available to all downstream agents
                    if agent_key == "idea_understanding":
                        if agent_output and "error" not in agent_output:
                            self.context["idea_profile"] = agent_output
                            # Also attach to input dict so prompt templates can see it
                            input_dict["ideaProfile"] = agent_output
                            logger.info(f"[CONTEXT] Idea profile successfully stored with keys: {list(agent_output.keys())}")
                        else:
                            logger.warning(f"[CONTEXT] IdeaUnderstandingAgent returned error or empty output, using fallback for downstream agents")
                            # Set a minimal fallback profile so downstream agents don't fail
                            fallback_profile = {
                                "category": "General",
                                "business_model": "Not specified",
                                "capital_intensity": "Medium",
                                "burn_profile": "Medium",
                                "hardware_dependency": "Medium",
                                "operational_complexity": "Medium",
                                "regulation_risk": "Medium",
                                "scalability_model": "Standard",
                                "margin_profile": "Medium",
                                "team_requirements": [],
                                "confidence": "low",
                                "notes": "Fallback profile due to IdeaUnderstandingAgent failure"
                            }
                            self.context["idea_profile"] = fallback_profile
                            input_dict["ideaProfile"] = fallback_profile
                    
                    # Make industry specialist bullets available to all downstream agents
                    if agent_key == "industry_specialist":
                        if agent_output and "error" not in agent_output:
                            self.context["industry_bullets"] = agent_output
                            # Also attach to input dict so prompt templates can see it
                            input_dict["industryBullets"] = agent_output
                            bullets = agent_output.get("bullets", [])
                            logger.info(f"[CONTEXT] Industry bullets stored: {len(bullets)} bullets for '{agent_output.get('industry_label', 'Unknown')}'")
                        else:
                            logger.warning(f"[CONTEXT] IndustrySpecialistAgent returned error or empty output")
                            self.context["industry_bullets"] = {"bullets": [], "industry_label": "General", "confidence": "low"}
                            input_dict["industryBullets"] = self.context["industry_bullets"]
                    
                    # Log execution
                    self.execution_log.append({
                        "agent": agent.name,
                        "status": "success",
                        "timestamp": datetime.now().isoformat(),
                        "output_keys": list(agent_output.keys())
                    })
                    
                    logger.info(f"[OK] {agent.name} completed successfully")
                    
                except Exception as e:
                    logger.error(f"[FAIL] {agent.name} failed: {str(e)}")
                    logger.error(f"[TRACEBACK] Full error: ", exc_info=True)
                    
                    # Log failure
                    self.execution_log.append({
                        "agent": agent.name,
                        "status": "failed",
                        "timestamp": datetime.now().isoformat(),
                        "error": str(e)
                    })
                    
                    # Store error in context
                    agent_key = self._get_agent_key(agent.name)
                    self.context[agent_key] = {"error": str(e)}
                    
                    # If IdeaUnderstandingAgent fails, provide fallback profile
                    if agent_key == "idea_understanding":
                        logger.warning(f"[FALLBACK] IdeaUnderstandingAgent failed, providing minimal profile for downstream agents")
                        fallback_profile = {
                            "category": "General",
                            "business_model": "Not specified",
                            "capital_intensity": "Medium",
                            "burn_profile": "Medium",
                            "hardware_dependency": "Medium",
                            "operational_complexity": "Medium",
                            "regulation_risk": "Medium",
                            "scalability_model": "Standard",
                            "margin_profile": "Medium",
                            "team_requirements": [],
                            "confidence": "low",
                            "notes": f"Fallback profile: {str(e)}"
                        }
                        self.context["idea_profile"] = fallback_profile
                        input_dict["ideaProfile"] = fallback_profile
            
            # Step 3: Build consolidated output
            logger.info("\n[STEP 3] Building consolidated report...")
            output = self._build_output()
            
            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds()
            output["metadata"] = {
                "execution_time_seconds": execution_time,
                "timestamp": datetime.now().isoformat(),
                "agents_executed": len(self.agents),
                "execution_log": self.execution_log,
                "cached": False  # This is a fresh execution
            }
            
            logger.info(f"[COMPLETE] Analysis complete in {execution_time:.2f}s")
            
            # Step 4: Store result in cache for future requests
            logger.info("\n[STEP 4] Storing result in cache...")
            cache_ttl = 3600  # 1 hour TTL (can be configured via env)
            cache_success = cache_set(cache_key, output, ttl=cache_ttl)
            
            if cache_success:
                logger.info(f"[CACHE STORE] ✓ Result cached successfully (TTL: {cache_ttl}s)")
            else:
                logger.warning("[CACHE STORE] ✗ Failed to cache result (execution still successful)")
            
            logger.info("=" * 70)
            
            return output
            
        except Exception as e:
            logger.error(f"\n[FAIL] Chain execution failed: {str(e)}")
            raise
    
    def _get_agent_key(self, agent_name: str) -> str:
        """
        Convert agent class name to context key.
        
        Example: FundingStageAgent -> funding_stage
        """
        # Remove 'Agent' suffix and convert to snake_case
        key = agent_name.replace("Agent", "")
        
        # Convert CamelCase to snake_case
        import re
        key = re.sub('([a-z0-9])([A-Z])', r'\1_\2', key).lower()
        
        return key
    
    def _build_output(self) -> Dict[str, Any]:
        """
        Build the final consolidated output from all agent results.
        
        Returns:
            Structured financial strategy report
        """
        return {
            "startup_name": self.context["input"]["startupName"],
            "idea_understanding": self.context.get("idea_understanding", {}),
            "industry_specialist": self.context.get("industry_specialist", {}),
            "funding_stage": self.context.get("funding_stage", {}),
            "raise_amount": self.context.get("raise_amount", {}),
            "investor_type": self.context.get("investor_type", {}),
            "runway": self.context.get("runway", {}),
            "financial_priority": self.context.get("financial_priority", {}),
            "summary": self._generate_summary()
        }
    
    def _generate_summary(self) -> str:
        """Generate a human-readable summary of the analysis."""
        stage = self.context.get("funding_stage", {}).get("funding_stage", "N/A")
        amount = self.context.get("raise_amount", {}).get("recommended_amount", "N/A")
        investor = self.context.get("investor_type", {}).get("primary_investor_type", "N/A")
        runway = self.context.get("runway", {}).get("estimated_runway_months", "N/A")
        
        return f"""Based on the analysis, {self.context['input']['startupName']} should target {stage} stage funding of {amount} from {investor}. This will provide approximately {runway} months of runway to achieve key milestones."""
    
    def get_execution_log(self) -> List[Dict[str, Any]]:
        """Return the execution log for debugging."""
        return self.execution_log
    
    def get_context(self) -> Dict[str, Any]:
        """Return the full shared context."""
        return self.context

