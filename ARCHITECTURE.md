# FinIQ Auth & Metrics - Architecture & Visual Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Next.js Frontend                       │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │            AuthProvider (SessionProvider)            │  │   │
│  │  │                                                       │  │   │
│  │  │  ┌─────────────────────────────────────────────────┐ │  │   │
│  │  │  │ Components (can use useSession, useAuth)        │ │  │   │
│  │  │  │                                                  │ │  │   │
│  │  │  │  - AuthButton (Sign In/Out)                    │ │  │   │
│  │  │  │  - FinanceStrategyResults (with UserMetrics)   │ │  │   │
│  │  │  │  - UserMetrics Dashboard                        │ │  │   │
│  │  │  │                                                  │ │  │   │
│  │  │  └─────────────────────────────────────────────────┘ │  │   │
│  │  │                                                       │  │   │
│  │  │  Session: Stored in HTTP-only cookie ✅             │  │   │
│  │  │  (next-auth.session-token)                          │  │   │
│  │  │                                                       │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                                                              │   │
│  │  API Calls:                                                 │   │
│  │  - generateStrategy() → user_id in Bearer token           │   │
│  │  - submitFeedback() → includes rating                     │   │
│  │  - getUserMetrics() → retrieves stats                     │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  NextAuth.js Routes:                                                │
│  - /api/auth/signin → Google login page                            │
│  - /api/auth/callback/google → Handle OAuth response              │
│  - /api/auth/session → Get current session                         │
│  - /api/auth/signout → Clear session                               │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴──────────────┐
                    │                              │
                    ▼                              ▼
         ┌──────────────────────┐      ┌──────────────────────┐
         │   Google OAuth       │      │  FastAPI Backend     │
         │   (Verification)     │      │  (Python)            │
         │                      │      │                      │
         │ - Verify credentials │      │ ┌──────────────────┐ │
         │ - Return user info   │      │ │  Auth Middleware │ │
         │ - Issue tokens       │      │ │                  │ │
         └──────────────────────┘      │ │ Extract user_id: │ │
                    │                  │ │ - Bearer token   │ │
                    │                  │ │ - From cookie    │ │
                    │                  │ └──────────────────┘ │
                    │                  │                      │
                    └─────────────────►│ ┌──────────────────┐ │
                                       │ │  API Endpoints   │ │
                                       │ │                  │ │
                                       │ │ POST /generate   │ │
                                       │ │ - Check auth ✓   │ │
                                       │ │ - Generate strat │ │
                                       │ │ - Increment counter
                                       │ │ - Return metrics │ │
                                       │ │                  │ │
                                       │ │ POST /feedback   │ │
                                       │ │ - Store rating   │ │
                                       │ │ - Calc average   │ │
                                       │ │                  │ │
                                       │ │ GET /metrics     │ │
                                       │ │ - Return stats   │ │
                                       │ │                  │ │
                                       │ └──────────────────┘ │
                                       │                      │
                                       │ ┌──────────────────┐ │
                                       │ │ Chain Manager    │ │
                                       │ │ (Generate)       │ │
                                       │ └──────────────────┘ │
                                       │                      │
                                       └──────────────────────┘
                                                │
                                                ▼
                                    ┌──────────────────────┐
                                    │   Redis Database     │
                                    │   (In-Memory Store)  │
                                    │                      │
                                    │ Keys (1-year TTL):   │
                                    │ user:{id}:           │
                                    │   :generations       │
                                    │   :feedback (hash)   │
                                    │   :last_active       │
                                    │                      │
                                    │ Keys (30-day TTL):   │
                                    │ session:{id}         │
                                    │   (session data)     │
                                    │                      │
                                    └──────────────────────┘
```

---

## Data Flow Sequence Diagrams

### 1. Login Flow

```
User                Browser               NextAuth.js            Google               Backend
│                      │                      │                    │                    │
├─ Click SignIn ───────►│                      │                    │                    │
│                      │                      │                    │                    │
│                      ├─ POST /signin ──────►│                    │                    │
│                      │                      │                    │                    │
│                      │◄─ Redirect to Google │                    │                    │
│                      │                      │                    │                    │
│      ┌───────────────────────────────────────────────────────────┤                    │
│      │ Google OAuth Popup Opens                                  │                    │
│      │ User approves permissions                                 │                    │
│      └───────────────────────────────────────────────────────────┤                    │
│                      │                      │                    │                    │
│                      │                      │◄─── OAuth Code ──── │                    │
│                      │                      │                    │                    │
│                      │                      ├─ Verify & Create JWT ──────────────────►│
│                      │                      │                    │      (optional)    │
│                      │◄─ Set Cookie ─────── │                    │                    │
│                      │  (next-auth.        │                    │                    │
│                      │   session-token)    │                    │                    │
│                      │                      │                    │                    │
│◄─ Redirect to / ────┤                      │                    │                    │
│                      │                      │                    │                    │
│ Session loaded       │                      │                    │                    │
│ useSession() now     │                      │                    │                    │
│ returns user data    │                      │                    │                    │
│                      │                      │                    │                    │

Result: User logged in, session stored in cookie, good for 30 days
```

---

### 2. Generation with Metrics Flow

```
User                Browser               FastAPI              Redis              Response
│                      │                      │                  │                   │
├─ Fill Form ─────────►│                      │                  │                   │
│                      │                      │                  │                   │
├─ Click Generate ────►│                      │                  │                   │
│                      │                      │                  │                   │
│     ┌────────────────────────────────────────────────────────┐                    │
│     │ Get session & extract user_id                         │                    │
│     │ (from next-auth.session-token cookie)                 │                    │
│     └────────────────────────────────────────────────────────┘                    │
│                      │                      │                  │                   │
│                      ├─ POST /generate ────►│                  │                   │
│                      │ Bearer: user_123    │                  │                   │
│                      │ prompt: "..."       │                  │                   │
│                      │                      │                  │                   │
│                      │     ┌──────────────────────────────────┐                   │
│                      │     │ Auth Middleware:                 │                   │
│                      │     │ Extract user_id from Bearer      │                   │
│                      │     │ Verify & set request.user_id     │                   │
│                      │     └──────────────────────────────────┘                   │
│                      │                      │                  │                   │
│                      │     ┌──────────────────────────────────┐                   │
│                      │     │ Chain Manager:                   │                   │
│                      │     │ Generate strategy using models   │                   │
│                      │     │ (this takes 5-30 seconds)        │                   │
│                      │     └──────────────────────────────────┘                   │
│                      │                      │                  │                   │
│                      │                      ├─ Increment ─────►│                   │
│                      │                      │ INCR user:123:   │                   │
│                      │                      │ generations      │                   │
│                      │                      │                  │                   │
│                      │                      │◄─ Return: 3 ──── │                   │
│                      │                      │                  │                   │
│                      │                      ├─ Update ─────────►│                   │
│                      │                      │ SET user:123:    │                   │
│                      │                      │ last_active      │                   │
│                      │                      │ = now()          │                   │
│                      │                      │                  │                   │
│                      │                      ├─ Get metrics ────►│                   │
│                      │                      │ GET generations  │                   │
│                      │                      │ HGETALL feedback │                   │
│                      │                      │                  │                   │
│                      │                      │◄─ Return metrics ─│                   │
│                      │                      │ { count: 3,      │                   │
│                      │                      │   avg_rating: 0 }│                   │
│                      │                      │                  │                   │
│                      │◄─ HTTP 200 ─────────┤                  │                   │
│                      │  { response: {...},  │                  │                   │
│                      │    tokens_used: 2500,│                  │                   │
│                      │    remaining: 4,     │                  │                   │
│                      │    user_metrics: {   │                  │                   │
│                      │      generation_: 3, │                  │                   │
│                      │      avg_rating: 0   │                  │                   │
│                      │    }}               │                  │                   │
│                      │                      │                  │                   │
│     ┌──────────────────────────────────────────────────────────┐                  │
│     │ Display Results:                                         │                  │
│     │ - Show strategy details                                  │                  │
│     │ - Show UserMetrics: "You've generated 3 strategies"      │                  │
│     │ - Show avg rating                                        │                  │
│     └──────────────────────────────────────────────────────────┘                  │
│                      │                      │                  │                   │

Result: Strategy generated, counter incremented, metrics displayed
```

---

### 3. Feedback/Rating Flow

```
User                Browser               FastAPI              Redis              Response
│                      │                      │                  │                   │
├─ Rate Strategy ─────►│                      │                  │                   │
│  (click 5 stars)     │                      │                  │                   │
│                      │                      │                  │                   │
│                      ├─ POST /feedback ────►│                  │                   │
│                      │ { user_id: "123",   │                  │                   │
│                      │   strategy_id: "x", │                  │                   │
│                      │   rating: 5 }       │                  │                   │
│                      │                      │                  │                   │
│                      │                      ├─ Store ─────────►│                   │
│                      │                      │ HSET user:123:   │                   │
│                      │                      │ feedback         │                   │
│                      │                      │ strat_x = 5      │                   │
│                      │                      │                  │                   │
│                      │                      ├─ Calculate ──────►│                   │
│                      │                      │ HGETALL user:123:│                   │
│                      │                      │ feedback         │                   │
│                      │                      │ → [5, 4, 5, 3]   │                   │
│                      │                      │ → avg = 4.25     │                   │
│                      │                      │                  │                   │
│                      │◄─ HTTP 200 ─────────┤                  │                   │
│                      │  { success: true,    │                  │                   │
│                      │    metrics: {        │                  │                   │
│                      │      avg_rating: 4.25│                  │                   │
│                      │    }}               │                  │                   │
│                      │                      │                  │                   │
│     ┌──────────────────────────────────────────────────────────┐                  │
│     │ Update Display:                                          │                  │
│     │ - Show rating success feedback                           │                  │
│     │ - Update UserMetrics avg rating: 4.25/5                 │                  │
│     │ - Show "Thanks for your feedback!"                       │                  │
│     └──────────────────────────────────────────────────────────┘                  │
│                      │                      │                  │                   │

Result: Rating stored, average updated, user sees updated metrics
```

---

## Component Hierarchy

```
app/layout.tsx (Root Layout)
│
└─► AuthProvider (SessionProvider wrapper)
    │
    ├─► Navbar
    │   ├─► AuthButton (useSession)
    │   │   ├─ Sign In button (if !session)
    │   │   └─ User menu (if session)
    │   │
    │   └─► Other nav items
    │
    ├─► Main Content
    │   │
    │   ├─► page.tsx (Home)
    │   │   └─ Hero section
    │   │
    │   └─► /finance-copilot/page.tsx
    │       ├─► FinanceInputForm
    │       │   └─ Uses useAuthSession to get user_id
    │       │   └─ Calls generateStrategy(prompt, userId)
    │       │
    │       └─► FinanceStrategyResults (when strategy loaded)
    │           │
    │           ├─► UserMetrics (useSession)
    │           │   ├─ "You've generated X strategies" (if logged in)
    │           │   ├─ "Average rating: Y/5" (if ratings exist)
    │           │   └─ "Sign in to track progress" (if not logged in)
    │           │
    │           ├─► Strategy sections
    │           │   ├─ Recommended Stage
    │           │   ├─ Raise Amount
    │           │   ├─ Target Investors
    │           │   └─ etc.
    │           │
    │           └─► Feedback UI (future)
    │               └─ 5-star rating component
    │
    ├─► Footer
    │
    └─► ErrorBoundary (wraps main)
```

---

## Redux/State Management Pattern

```
NextAuth Session (Cookie-Based)
│
├─► browser: HTTP-only cookie
│   └─ next-auth.session-token (encrypted JWT)
│
└─► server-side: JWT validation
    └─ Contains: { user: { id, email, name, image }, ... }


API Request Pattern
│
├─► Frontend extracts user_id from session
│
├─► Sends request with Bearer token:
│   Authorization: Bearer user_123
│
└─► Backend:
    ├─► Middleware extracts user_id
    ├─► Sets request.state.user_id = "user_123"
    └─► Route handler accesses it


Redis Data Pattern
│
├─► Key: user:{id}:generations
│   Value: "3" (counter)
│   TTL: 1 year
│
├─► Key: user:{id}:feedback
│   Type: Hash
│   Value: { "strat_1": "5", "strat_2": "4" }
│   TTL: 1 year
│
└─► Key: session:{id}
    Value: { "email": "...", "name": "..." }
    TTL: 30 days
```

---

## API Endpoint Summary

```
NextAuth.js Endpoints (Built-in)
├─ GET /api/auth/signin
│  └─ Redirects to Google OAuth
│
├─ GET /api/auth/callback/google
│  └─ Handles OAuth redirect from Google
│
├─ GET /api/auth/session
│  └─ Returns current session (or null)
│
└─ POST /api/auth/signout
   └─ Clears session cookie


FastAPI Endpoints (Custom)
├─ POST /api/generate
│  ├─ Input: { user_id, prompt, input_overrides }
│  ├─ Auth: Bearer token required
│  └─ Output: { response, tokens_used, remaining_trials, user_metrics }
│
├─ POST /api/feedback
│  ├─ Input: { user_id, strategy_id, rating }
│  ├─ Auth: Bearer token required
│  └─ Output: { success, metrics }
│
└─ GET /api/metrics/{user_id}
   ├─ Auth: Bearer token required
   └─ Output: { generation_count, average_rating, last_active }
```

---

## Database Schema (Redis)

```
user:{user_id}:generations
├─ Type: String (Counter)
├─ Value: "3"
├─ TTL: 365 days
└─ Example: user:user_abc123:generations → 3

user:{user_id}:feedback
├─ Type: Hash
├─ Fields:
│  ├─ strategy_id_1 → 5
│  ├─ strategy_id_2 → 4
│  └─ strategy_id_3 → 5
├─ TTL: 365 days
└─ Example: user:user_abc123:feedback → {strat_1: 5, strat_2: 4}

user:{user_id}:last_active
├─ Type: String (Timestamp)
├─ Value: "2024-12-18T10:30:45.123456"
├─ TTL: 365 days
└─ Example: user:user_abc123:last_active → 2024-12-18T10:30:45

session:{session_id}
├─ Type: String (JSON)
├─ Value: { "user": { "id": "...", "email": "...", "name": "..." } }
├─ TTL: 30 days (2592000 seconds)
└─ Example: session:xyz789 → {...session_data...}

Expiration Strategy
├─ User data: 1 year (allows historical tracking)
├─ Sessions: 30 days (matches NextAuth default)
└─ Automatic cleanup: Redis handles via TTL
```

---

## Security Model

```
Frontend → Backend Communication
│
├─ HTTPS (required in production)
│
├─ Cookie: next-auth.session-token (HttpOnly, Secure, SameSite)
│  ├─ Cannot be accessed via JavaScript
│  ├─ Only sent over HTTPS in production
│  ├─ Protected against CSRF
│  └─ Automatically managed by NextAuth
│
└─ Bearer Token (for API requests)
   ├─ user_id sent in Authorization header
   ├─ Extracted by auth middleware
   ├─ Validated against session
   └─ Rate limited per user_id


Backend → Redis Communication
│
├─ Redis connection (local or remote)
│  ├─ Optional authentication (password)
│  └─ Optional TLS encryption
│
└─ User data isolation
   ├─ Keys prefixed with user_id
   ├─ Each user can only access their data
   └─ No cross-user data leakage

OAuth Security (Google)
│
├─ Client ID/Secret never exposed to browser
├─ Redirect URI validation
├─ PKCE (Proof Key for Code Exchange)
├─ JWT signature verification
└─ State parameter for CSRF protection
```

---

## Performance Considerations

```
Frontend Performance
├─ Session check on every request: < 1ms (cached)
├─ useSession() call: ~10-50ms (from cookie)
└─ API calls: ~1-5s (includes strategy generation)

Backend Performance
├─ Auth middleware: < 1ms (header parsing)
├─ Redis operations: < 5ms (in-memory)
├─ Strategy generation: 5-30s (depends on model)
└─ Metrics calculation: < 10ms (small dataset)

Caching Strategy
├─ Session cached in cookie (30 days)
├─ Metrics cached in Redis (always available)
├─ Strategy results can be cached (optional)
└─ User preference checks (minimal queries)

Scaling Considerations
├─ Stateless backend (scale horizontally)
├─ Redis as single data source (can use Redis cluster)
├─ NextAuth.js handles session scaling
└─ No session affinity required
```

---

## Future Architecture Enhancements

```
Current (1.0)
├─ Single Redis instance
├─ No database (minimal)
└─ Basic metrics


Potential (2.0)
├─ Redis cluster for high availability
├─ Optional PostgreSQL for historical data
├─ Email notifications
└─ Advanced analytics


Advanced (3.0)
├─ Multi-region deployment
├─ Strategy comparison & leaderboard
├─ Machine learning for recommendations
└─ Premium tier with custom models
```

---

**Last Updated**: December 18, 2024
**Version**: 1.0.0
