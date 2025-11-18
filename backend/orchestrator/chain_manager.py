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
)
from utils import validate_startup_input, input_to_dict

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
        try:
            self.agents = [
                IdeaUnderstandingAgent(api_key=api_key),
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
            Consolidated financial strategy report
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
                        self.context["idea_profile"] = agent_output
                        # Also attach to input dict so prompt templates can see it
                        input_dict["ideaProfile"] = agent_output
                    
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
                    
                    # Log failure
                    self.execution_log.append({
                        "agent": agent.name,
                        "status": "failed",
                        "timestamp": datetime.now().isoformat(),
                        "error": str(e)
                    })
                    
                    # Continue with next agent (graceful degradation)
                    self.context[agent_key] = {"error": str(e)}
            
            # Step 3: Build consolidated output
            logger.info("\n[STEP 3] Building consolidated report...")
            output = self._build_output()
            
            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds()
            output["metadata"] = {
                "execution_time_seconds": execution_time,
                "timestamp": datetime.now().isoformat(),
                "agents_executed": len(self.agents),
                "execution_log": self.execution_log
            }
            
            logger.info(f"[COMPLETE] Analysis complete in {execution_time:.2f}s")
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

