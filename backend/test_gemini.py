import os
from dotenv import load_dotenv
from pathlib import Path

from utils.llm_client import llm_client

env_local = Path(".env.local")
load_dotenv(env_local) if env_local.exists() else load_dotenv()

print("Testing unified LLM client with provider priority: Groq → DeepSeek → OpenRouter → Gemini")

try:
    text = llm_client.generate("Return a JSON object: {\"hello\": \"world\"}", temperature=0.1, max_output_tokens=64)
    print(f"✓ LLM client working! Raw response: {text}")
except Exception as e:
    print(f"✗ LLM CLIENT ERROR: {str(e)}")

