"""
Quick test script to debug IdeaUnderstandingAgent
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
# Load from backend/.env.local
env_local = backend_dir / '.env.local'
if env_local.exists():
    load_dotenv(env_local)
else:
    load_dotenv()

from agents import IdeaUnderstandingAgent

# Test input
test_input = {
    "startupName": "Inferix Compute Grid",
    "ideaDescription": "A decentralized GPU grid for AI training workloads that offers predictable pricing, on-demand scaling, and fault-tolerant distributed compute for training LLMs and multi-modal models.",
    "industry": "AI Infrastructure",
    "businessModel": "Usage-based pricing",
    "targetMarket": "ML engineers and AI labs"
}

print("=" * 70)
print("Testing IdeaUnderstandingAgent...")
print("=" * 70)

try:
    agent = IdeaUnderstandingAgent()
    print(f"\n[OK] Agent initialized successfully")
    
    result = agent.run(test_input, {})
    
    print(f"\n[SUCCESS] Agent completed successfully!")
    print(f"\nResult keys: {list(result.keys())}")
    print(f"\nFull output:")
    import json
    print(json.dumps(result, indent=2))
    
except Exception as e:
    print(f"\n[ERROR] Agent failed: {str(e)}")
    import traceback
    traceback.print_exc()

