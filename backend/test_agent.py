"""
Quick test script for individual agents
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment from .env.local (Next.js style) or .env
env_local = Path('.env.local')
env_file = Path('.env')

if env_local.exists():
    load_dotenv(env_local)
elif env_file.exists():
    load_dotenv(env_file)
else:
    load_dotenv()  # Try default locations

# Test input
test_input = {
    "startupName": "QuickTest Startup",
    "industry": "SaaS",
    "targetMarket": "B2B",
    "geography": "United States",
    "teamSize": 3,
    "productStage": "MVP",
    "monthlyRevenue": 2000,
    "growthRate": "10% MoM",
    "tractionSummary": "20 beta users",
    "businessModel": "Subscription",
    "fundingGoal": 300000,
    "mainFinancialConcern": "Need runway"
}


def test_funding_stage_agent():
    """Test FundingStageAgent independently"""
    from agents import FundingStageAgent
    
    print("\n" + "="*50)
    print("Testing FundingStageAgent")
    print("="*50)
    
    agent = FundingStageAgent()
    result = agent.run(test_input, {})
    
    print("\n✓ Result:")
    import json
    print(json.dumps(result, indent=2))
    
    return result


def test_raise_amount_agent():
    """Test RaiseAmountAgent with mock funding stage"""
    from agents import RaiseAmountAgent
    
    print("\n" + "="*50)
    print("Testing RaiseAmountAgent")
    print("="*50)
    
    context = {
        "funding_stage": {
            "funding_stage": "Seed",
            "confidence": "high"
        }
    }
    
    agent = RaiseAmountAgent()
    result = agent.run(test_input, context)
    
    print("\n✓ Result:")
    import json
    print(json.dumps(result, indent=2))
    
    return result


def test_full_chain():
    """Test complete chain"""
    from orchestrator import ChainManager
    
    print("\n" + "="*50)
    print("Testing Full Agent Chain")
    print("="*50)
    
    chain = ChainManager(api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    result = chain.run(test_input)
    
    print("\n✓ Result:")
    import json
    print(json.dumps(result, indent=2))
    
    return result


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        test_name = sys.argv[1]
        
        if test_name == "funding":
            test_funding_stage_agent()
        elif test_name == "raise":
            test_raise_amount_agent()
        elif test_name == "full":
            test_full_chain()
        else:
            print("Usage: python test_agent.py [funding|raise|full]")
    else:
        # Run all tests
        print("Running all tests...")
        test_funding_stage_agent()
        test_raise_amount_agent()
        test_full_chain()

