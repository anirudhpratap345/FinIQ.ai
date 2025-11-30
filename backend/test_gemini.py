import os
from dotenv import load_dotenv
from pathlib import Path
import google.generativeai as genai

env_local = Path('.env.local')
load_dotenv(env_local) if env_local.exists() else load_dotenv()

api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
print(f'Testing Gemini API with key: {api_key[:10]}...{api_key[-5:] if api_key else "NONE"}')

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content('Say hello in one word')
    print(f'✓ API working! Response: {response.text}')
except Exception as e:
    print(f'✗ API ERROR: {str(e)}')

