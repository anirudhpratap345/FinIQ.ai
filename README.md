## FinIQ.ai – AI Finance Strategy Copilot for Startup Founders

FinIQ.ai is an AI-powered copilot that helps startup founders design a **funding and financial strategy**: what stage to raise, how much to raise, from whom, how long the money lasts, and what to prioritize.

This repo contains **two main layers**:
- **Frontend**: A Next.js app where founders input startup details and view the generated strategy.
- **Backend**: A Python FastAPI service running a **multi-agent Gemini-based pipeline** with full-pipeline caching.

---

## Architecture Overview

### High-Level System Diagram

- **Frontend (Next.js / React)**
  - Finance input form (`FinanceInputForm.tsx`)
  - Results UI (`FinanceStrategyResults.tsx`, `ResultCard`, `MarketAnalysisDisplay`, etc.)
  - Primary API route: `src/app/api/finance-strategy/route.ts`
  - Local TypeScript agent chain (`src/lib/agents/finance-agents.ts`) – earlier implementation

- **Backend (Python / FastAPI)**
  - Public API: `POST /api/generate` in `backend/api_server.py`
  - Orchestrator: `backend/orchestrator/chain_manager.py`
  - Agents: `backend/agents/*.py`
  - Prompt templates: `backend/utils/prompt_templates.py`
  - Validation: `backend/utils/data_validation.py`
  - Caching: `backend/utils/cache.py` (Redis + file fallback)

- **LLM Providers**
  - Backend: `google-generativeai` (Gemini) in Python agents
  - Frontend: `@google/generative-ai`, `openai`, `groq-sdk` via `src/lib/ai` and `src/lib/agents`

At the moment, there is **some duplication** between the legacy TypeScript agent system and the newer Python backend agent system. The long-term direction is to lean on the **Python multi-agent backend + caching** as the primary “brain”.

---

## Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript, React 19
- **Styling**: Tailwind CSS 4, custom components, Framer Motion
- **UI Components**: Custom `ui/*` primitives (button, input, select, textarea, card, etc.)
- **State & Data Flow**:
  - Form validation in `src/lib/validation/finance-inputs.ts`
  - Typed models in `src/types/finance-copilot.ts`
  - API client helpers in `src/lib/api.ts` and `src/lib/api/client.ts`

### Backend

- **Framework**: FastAPI (`backend/api_server.py`)
- **Runtime**: Python 3
- **LLM Client**: `google-generativeai` (Gemini)
- **Data Validation**: Pydantic v2 (`backend/utils/data_validation.py`)
- **Orchestration**: Custom chain manager (`backend/orchestrator/chain_manager.py`)
- **Caching**: Redis + file-based fallback (`backend/utils/cache.py`)
- **Rate Limiting / Trials**: In-memory (with optional Redis limiter)

### DevOps & Tooling

- **Frontend build**: Next.js, TypeScript, ESLint, Jest
- **Backend**: `uvicorn` for local dev, `requirements.txt` and `runtime.txt` for deploys
- **Containers**: `Dockerfile`, `docker-compose.yml`, `nginx.conf`

---

## Backend Architecture (Python Agent System)

### Request Flow (FastAPI)

1. **Client calls** `POST /api/generate` (`backend/api_server.py`):
   - Request model: `GenerateRequest` with:
     - `user_id`: string (used for simple trial limiting)
     - `prompt`: free-text description of concern
     - `input_overrides`: optional structured overrides (startup name, revenue, etc.)

2. **Build base input payload**:
   - `base_input` includes defaults for:
     - `startupName`, `industry`, `targetMarket`, `geography`
     - `teamSize`, `productStage`, `monthlyRevenue`, `tractionSummary`
     - `businessModel`, `fundingGoal`, `mainFinancialConcern`
   - `input_overrides` from the frontend overwrite these defaults.

3. **Call `ChainManager.run(base_input)`**:
   - Handles validation, caching, agent orchestration, and result shaping.

4. **Return `GenerateResponse`**:
   - `response`: full strategy payload from the chain
   - `tokens_used`: naive token approximation
   - `remaining_trials`: simple per-user trial counter

### Input Validation

- Defined in `backend/utils/data_validation.py` as `StartupInput`:
  - Fields include:
    - `startupName`, `oneLineDescription`, `industry`, `targetMarket`, `geography`
    - `teamSize`, `productStage`, `monthlyRevenue`, `growthRate`
    - `tractionSummary`, `businessModel`, `fundingGoal`, `mainFinancialConcern`
    - `ideaDescription` (long-form idea context)
  - Validation:
    - Max lengths on text fields
    - Enum-like patterns for `productStage` and `targetMarket`
    - Type coercion for numbers (string → float/int)

### Orchestration – `ChainManager`

Location: `backend/orchestrator/chain_manager.py`

- **Steps**:
  1. Validate and normalize input via `validate_startup_input` and `input_to_dict`.
  2. Build normalized keys:
     - `startup_name`, `one_line_description`, `idea_description`
  3. **Full-pipeline cache check**:
     - Compute hash with `compute_hash(input_dict)`
     - Attempt `cache_get(cache_key)`
     - On hit: return cached result immediately with `metadata.cached = true`.
  4. On cache miss:
     - Initialize context: `{"input": input_dict}`
     - Execute agents sequentially:
       - `IdeaUnderstandingAgent`
       - `FundingStageAgent`
       - `RaiseAmountAgent`
       - `InvestorTypeAgent`
       - `RunwayAgent`
       - `FinancialPriorityAgent`
     - Each agent:
       - Receives `input_dict` + shared `context`
       - Writes output into `context` under a snake_case key (`funding_stage`, `raise_amount`, etc.)
     - Special handling for `IdeaUnderstandingAgent`:
       - Stores `idea_profile` in `context["idea_profile"]` and `input_dict["ideaProfile"]`
       - Downstream agents read this profile to reason about capital intensity, burn, regulation risk, etc.
       - If it fails, a heuristic fallback profile is injected so downstream agents still work.
  5. Build final output via `_build_output()`:
     - Assembles:
       - `startup_name`
       - `idea_understanding`
       - `funding_stage`
       - `raise_amount`
       - `investor_type`
       - `runway`
       - `financial_priority`
       - `summary` (human-readable sentence)
  6. Attach `metadata`:
     - `execution_time_seconds`
     - `timestamp`
     - `agents_executed`
     - `execution_log` (per-agent status)
     - `cached = false` (for fresh run)
  7. Store in cache using `cache_set(cache_key, output, ttl=...)`.

### AI Agents (Python)

All defined in `backend/agents/` and described in detail in `README_AGENTS.md` and `AGENT_SYSTEM_COMPLETE.md`.

- **IdeaUnderstandingAgent**
  - Creates a structured `idea_profile` from:
    - `startup_name`, `one_line_description`, `idea_description`, `industry`, etc.
  - Output fields:
    - `category`, `business_model`, `capital_intensity`, `burn_profile`
    - `hardware_dependency`, `operational_complexity`, `regulation_risk`
    - `scalability_model`, `margin_profile`, `team_requirements`, `confidence`, `notes`
  - This profile is the “brain” input for all downstream agents.

- **FundingStageAgent**
  - Decides funding stage (Idea, Pre-Seed, Seed, Series A, Series B+, Bootstrapped).
  - Uses:
    - Product stage, revenue, traction, team size, growth rate
    - `ideaProfile` (capital intensity, burn, complexity)
  - Output:
    - `funding_stage`, `confidence`, `rationale`, `stage_characteristics`.

- **RaiseAmountAgent**
  - Recommends how much to raise given:
    - Funding stage, team size, goals
    - `ideaProfile` (capital intensity, burn profile)
  - Output:
    - `recommended_amount`, `minimum_viable`, `optimal_amount`
    - `rationale` and a cost `breakdown`.

- **InvestorTypeAgent**
  - Chooses investor types (angels, seed VCs, sector funds, corporate, etc.).
  - Uses:
    - Geography, industry, stage, raise amount
    - `ideaProfile` (regulation risk, category, capital intensity).

- **RunwayAgent**
  - Estimates runway and burn rate.
  - Uses:
    - Raise amount, team size, revenue, geography
    - `ideaProfile` (burn profile, operational complexity, hardware dependency, team requirements).

- **FinancialPriorityAgent**
  - Synthesizes everything into 3–5 key financial priorities:
    - Fundraising, hiring, product, GTM, infra, compliance, etc.
  - Uses:
    - All prior agent outputs
    - `ideaProfile` to tailor priorities to domain risks.

All prompts live in `backend/utils/prompt_templates.py` and are:
- Highly structured, JSON-only outputs
- Explicitly include:
  - Startup Name
  - One-line Description
  - Full Startup Idea Description
  - Idea Profile fields
- Include **“Use ALL information provided (including the full description)”** instructions to reduce generic fallback behavior.

---

## Caching & Rate Limiting

### Full-Pipeline Caching (`backend/utils/cache.py`)

- **Key idea**: Cache the **entire agent-chain output** for a given input.
- **Key functions**:
  - `compute_hash(input_data)` – stable SHA-256 over normalized input (ignores metadata).
  - `cache_get(key)` – tries Redis first, then file cache.
  - `cache_set(key, value, ttl)` – stores JSON in Redis (with TTL) or `backend/cache/` directory.
  - `get_cache_stats()` – stats for monitoring.
  - `cache_clear()` – clear cached entries (API exposed).

### Behavior

- On each `/api/generate`:
  - Compute cache key from validated input.
  - If hit:
    - Returns cached result instantly.
    - `metadata.cached = true`, with `cache_retrieval_time_seconds`.
  - If miss:
    - Runs full chain, stores result, and returns with `cached = false`.

### Benefits

- **API cost reduction**: 80–95% fewer Gemini calls for repeated or similar inputs.
- **Latency**:
  - Cold run: ~10–15 seconds (multi-agent).
  - Cached run: <100ms.

### Rate Limiting / Trials

- Simple trial limiter in `backend/api_server.py`:
  - `TRIAL_LIMIT` (default 1000, overridable via `FINANCE_TRIAL_LIMIT`).
  - Currently **in-memory per-process**, optional Redis-based limiter stub exists in `backend/core/limiter_redis.py`.

---

## Frontend Architecture (Next.js)

### Key Paths

- `src/app/page.tsx` – main landing page
- `src/app/finance-copilot/page.tsx` – main product experience
- `src/app/api/finance-strategy/route.ts` – current API route that:
  - Validates inputs (`validateStartupInputs`, `sanitizeStartupInputs`)
  - Calls TypeScript agent chain (`generateFinanceStrategy` in `src/lib/agents/finance-agents.ts`)
  - Returns `FinanceStrategyResponse` (success flag, strategy, timestamps).

### TypeScript Agent System (Legacy / Parallel)

- **Location**: `src/lib/agents/finance-agents.ts` and related files.
- **Behavior**:
  - Similar conceptual agents as the Python backend (funding stage, amount, investor types, runway, priorities).
  - Uses JS/TS LLM clients (`@google/generative-ai`, `openai`, `groq-sdk`) depending on provider configuration.

Currently, the frontend is still primarily wired to this **TS agent path**, while the Python backend provides a **more robust, cached, and observability-friendly pipeline**. Aligning both to a single source of truth is a key next step.

---

## Output Model

### Backend (Python Chain Output)

The chain returns a JSON object shaped like:

- **Top-level fields** (from `_build_output()`):
  - `startup_name`
  - `idea_understanding`
  - `funding_stage`
  - `raise_amount`
  - `investor_type`
  - `runway`
  - `financial_priority`
  - `summary`
  - `metadata`

- **Metadata**:
  - `execution_time_seconds`
  - `timestamp`
  - `agents_executed`
  - `execution_log` (per-agent status + timestamps)
  - `cached` (true/false)
  - On cached responses: `cache_retrieval_time_seconds`, `original_execution_time_seconds`.

This structure is documented in more detail in:
- `README_AGENTS.md`
- `AGENT_SYSTEM_COMPLETE.md`
- `backend/CACHING.md`

---

## Current Bottlenecks & Main Problems

### 1. Dual Agent Systems (TS vs Python)

- **Problem**: There are two parallel implementations:
  - TypeScript agent chain inside the Next.js app.
  - Python FastAPI + multi-agent backend with caching.
- **Impact**:
  - Architecture feels fragmented; it’s unclear which “brain” is canonical.
  - Harder to maintain, test, and evolve prompts/logic.
  - Product improvements on the Python side (e.g., caching, better prompts) are not yet fully leveraged by the frontend.

### 2. Latency on Cold Runs

- Even with good prompts, a full multi-agent chain (5–6 Gemini calls) takes **~10–15 seconds** uncached.
- This is acceptable for deep analysis but still feels slow compared to “instant” consumer tools.
- Caching helps a lot, but **first-run latency** is still a UX friction.

### 3. Single-Provider Dependency & Quota Limits

- Backend currently uses **only Gemini** via `google-generativeai`.
- When quotas are exhausted or the key is misconfigured:
  - Agents fall back to heuristics → generic outputs.
  - This is exactly what you observed earlier (e.g., always “Series A”, “$2M–$10M”, generic burn).
- There is no automatic provider failover (e.g., to OpenAI or Groq) on the Python side.

### 4. No Persistent Data Layer

- There is **no database**:
  - Reports are not saved.
  - No user accounts, no history, no longitudinal tracking.
  - No analytics on how users interact with strategies.
- This limits:
  - Real product value (founders can’t come back to prior plans).
  - Ability to iterate using real-world feedback and outcomes.

### 5. Limited Real-World Integration

- The system **does not connect** to:
  - Actual financial data (bank accounts, Stripe, accounting tools).
  - Real investor databases (names, funds, check sizes).
- As a result, strategies remain **high-level and “advisory”**, not executable plans tied to real constraints.

### 6. Evaluation & Trust

- There is no automated evaluation loop:
  - No benchmarks or unit tests for **quality** of strategies, only for structure (JSON, timing, etc.).
  - No mechanism for users to rate strategies or correct them.
- This makes it harder to:
  - Iterate toward truly “VC-grade” advice.
  - Prove the system is better than generic GPT prompts.

### 7. Trial Limiting & Production Hardening

- Trial limiting is **in-memory per process**:
  - Not resilient across restarts or multiple instances.
  - Not persistent or tamper-resistant.
- Logging exists, but:
  - No centralized metrics or dashboards (e.g., Prometheus/Grafana, Sentry).
  - Harder to monitor live behavior and identify failure patterns.

---

## Why It’s Not Yet Truly Impactful (Product-Level View)

Even though the architecture is fairly advanced technically (multi-agent chain, idea profile, caching), **the product still feels like “a nice AI report generator” rather than an indispensable founder tool**. Key reasons:

- **One-shot experience**:
  - User fills a form, gets a PDF-like strategy, and that’s it.
  - No iterative loop: revisiting strategy, tracking milestones, updating based on real data.

- **No deep integration with founder workflow**:
  - Not plugged into banking, accounting, CRM, or investor CRMs.
  - Recommendations are not directly actionable inside tools founders already use.

- **No persistence or collaboration**:
  - Can’t save, share, or compare multiple scenarios (e.g., “bootstrapped vs VC-funded” plans).
  - No collaborative features for co-founders or advisors.

- **Generic feel when LLM is constrained**:
  - Under quota limits or API errors, the system falls back to heuristics → “looks like medium blog post advice”.
  - Without consistent high-quality LLM access, the differentiation is reduced.

In short: **great technical foundation, but the user-facing impact is capped by missing data integration, persistence, and a clear “daily-use” workflow**.

---

## Suggested Next Steps / Roadmap

### Short-Term (Technical)

- **Unify the brain**:
  - Decide whether the TypeScript or Python agent chain is the canonical source of truth.
  - Wire the frontend `/api/finance-strategy` route to call the FastAPI backend (or fully deprecate one path).

- **Add multi-provider fallback** to Python backend:
  - If Gemini fails or is rate-limited, fail over to another LLM (OpenAI, Groq) with compatible prompts.

- **Introduce a small database** (e.g., Supabase / Postgres):
  - Store strategies, user sessions, and feedback.
  - Enable “history” and “compare scenarios”.

### Medium-Term (Product)

- **Scenario planning**:
  - Let founders compare “Raise $500K vs $1.5M vs $0 (bootstrapped)” in one UI.

- **Real investor & data integration**:
  - Connect to actual investor lists (even if basic at first).
  - Integrate simplified revenue / expense inputs or CSV upload.

- **Feedback loop**:
  - Add 1–5 star ratings and “this was accurate / not accurate” options to refine prompts and heuristics.

---

## Getting Started Locally

### Frontend

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Backend

```bash
cd backend
pip install -r requirements.txt
python api_server.py
```

Backend defaults to `http://localhost:8000`.

For detailed caching docs, see:
- `backend/CACHING.md`
- `backend/CACHE_QUICKSTART.md`

For deep agent system docs, see:
- `README_AGENTS.md`
- `AGENT_SYSTEM_COMPLETE.md`

---

## Status

- **Frontend UI**: Functional, productized, modern.
- **Python Multi-Agent Backend**: Production-ready core, with caching and validation.
- **Integration between them**: Partially wired, still some duplication.
- **Impact**: Good for generating structured strategies; not yet an indispensable, data-integrated finance tool – but the architecture is ready to evolve in that direction.

**FinIQ.ai** is now at a strong **technical foundation stage**; the next big wins come from **unifying the architecture** and building features that tie the AI more tightly to real founder workflows and data.
