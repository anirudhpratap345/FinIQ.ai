"""
Unified LLM client with automatic provider failover.

Order of preference (if API keys are set):
1. Groq
2. DeepSeek
3. OpenRouter
4. Gemini (fallback, last resort)

Design goals:
- JSON-first: all prompts are written to return ONLY JSON.
  This client just returns raw text; agents are responsible for parsing.
- Failover: if a provider errors or times out, we log and try the next one.
- Simplicity: no streaming, single-turn chat completion.
"""

from __future__ import annotations

import os
import logging
from typing import Optional, Callable

import requests

try:
    import google.generativeai as genai  # type: ignore
except ImportError:  # pragma: no cover - handled at runtime
    genai = None


logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(self) -> None:
        # Provider API keys
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        # Optional model overrides
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        self.openrouter_model = os.getenv(
            "OPENROUTER_MODEL",
            "meta-llama/3.1-70b-instruct"
        )
        self.gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        # Lazy Gemini model
        self._gemini_model = None

        # Log configuration summary (without leaking keys)
        providers = []
        if self.groq_api_key:
            providers.append(f"Groq[{self.groq_model}]")
        if self.deepseek_api_key:
            providers.append(f"DeepSeek[{self.deepseek_model}]")
        if self.openrouter_api_key:
            providers.append(f"OpenRouter[{self.openrouter_model}]")
        if self.gemini_api_key and genai is not None:
            providers.append(f"Gemini[{self.gemini_model_name}]")

        if providers:
            logger.info(f"[LLM] Available providers (in order): {', '.join(providers)}")
        else:
            logger.warning("[LLM] No LLM providers configured. All calls will fail.")

    # --------------------------------------------------------------------- #
    # Public API
    # --------------------------------------------------------------------- #

    def generate(
        self,
        prompt: str,
        *,
        temperature: float = 0.3,
        max_output_tokens: int = 1024,
    ) -> str:
        """
        Generate a completion for the given prompt using the first available provider.

        Returns:
            Raw text response (agents are responsible for JSON parsing).

        Raises:
            RuntimeError if all providers fail or none are configured.
        """
        last_error: Optional[Exception] = None

        # Provider order: Groq → DeepSeek → OpenRouter → Gemini
        providers: list[tuple[str, Callable[..., str]]] = [
            ("groq", self._call_groq),
            ("deepseek", self._call_deepseek),
            ("openrouter", self._call_openrouter),
            ("gemini", self._call_gemini),
        ]

        for name, fn in providers:
            try:
                if not self._provider_available(name):
                    continue

                logger.info(f"[LLM] Trying provider: {name}")
                text = fn(prompt, temperature=temperature, max_tokens=max_output_tokens)
                if text and isinstance(text, str) and text.strip():
                    logger.info(f"[LLM] Provider {name} succeeded")
                    return text
            except Exception as e:  # pragma: no cover - runtime behaviour
                last_error = e
                logger.warning(f"[LLM] Provider {name} failed: {e}", exc_info=True)

        raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")

    # --------------------------------------------------------------------- #
    # Provider helpers
    # --------------------------------------------------------------------- #

    def _provider_available(self, name: str) -> bool:
        if name == "groq":
            return bool(self.groq_api_key)
        if name == "deepseek":
            return bool(self.deepseek_api_key)
        if name == "openrouter":
            return bool(self.openrouter_api_key)
        if name == "gemini":
            return bool(self.gemini_api_key and genai is not None)
        return False

    def _call_groq(self, prompt: str, *, temperature: float, max_tokens: int) -> str:
        """
        Call Groq's OpenAI-compatible chat completions API.
        Docs: https://console.groq.com/docs/openai
        """
        if not self.groq_api_key:
            raise RuntimeError("GROQ_API_KEY not set")

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.groq_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a precise JSON-generating assistant. "
                               "Always return ONLY valid JSON, no markdown or commentary.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code >= 400:
            raise RuntimeError(f"Groq error {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        if not content:
            raise RuntimeError("Groq returned empty content")
        return content

    def _call_deepseek(self, prompt: str, *, temperature: float, max_tokens: int) -> str:
        """
        Call DeepSeek chat completions API.
        Docs: https://platform.deepseek.com/api-docs
        """
        if not self.deepseek_api_key:
            raise RuntimeError("DEEPSEEK_API_KEY not set")

        url = "https://api.deepseek.com/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.deepseek_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.deepseek_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a precise JSON-generating assistant. "
                               "Always return ONLY valid JSON, no markdown or commentary.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code >= 400:
            raise RuntimeError(f"DeepSeek error {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        if not content:
            raise RuntimeError("DeepSeek returned empty content")
        return content

    def _call_openrouter(self, prompt: str, *, temperature: float, max_tokens: int) -> str:
        """
        Call OpenRouter chat completions API.
        Docs: https://openrouter.ai/docs
        """
        if not self.openrouter_api_key:
            raise RuntimeError("OPENROUTER_API_KEY not set")

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            # Optional but recommended metadata
            "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "https://finiq.ai"),
            "X-Title": os.getenv("OPENROUTER_APP_NAME", "FinIQ.ai"),
        }
        payload = {
            "model": self.openrouter_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a precise JSON-generating assistant. "
                               "Always return ONLY valid JSON, no markdown or commentary.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code >= 400:
            raise RuntimeError(f"OpenRouter error {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        if not content:
            raise RuntimeError("OpenRouter returned empty content")
        return content

    def _call_gemini(self, prompt: str, *, temperature: float, max_tokens: int) -> str:
        """
        Call Gemini as a last-resort fallback.
        Uses the same API as before but centralized here.
        """
        if not (self.gemini_api_key and genai is not None):
            raise RuntimeError("Gemini not available (missing api key or library)")

        if self._gemini_model is None:
            genai.configure(api_key=self.gemini_api_key)
            self._gemini_model = genai.GenerativeModel(self.gemini_model_name)
            logger.info(f"[LLM] Gemini model initialised: {self.gemini_model_name}")

        response = self._gemini_model.generate_content(
            prompt,
            generation_config={
                "temperature": temperature,
                "top_p": 0.8,
                "max_output_tokens": max_tokens,
            },
        )
        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini returned empty response")
        return text


# Singleton instance used by all agents
llm_client = LLMClient()


