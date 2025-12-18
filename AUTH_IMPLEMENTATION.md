# FinIQ Authentication & Metrics Implementation Guide

## Overview

This document describes the complete implementation of user authentication and per-user metrics tracking for FinIQ.

**Key Features:**
- Google OAuth login via NextAuth.js
- Session management in Redis (30-day TTL)
- Real-time generation counters and feedback ratings
- Personalized metrics dashboard on results page
- No email/password auth, no database required

---

## Architecture

### Frontend Stack
- **Auth Provider**: NextAuth.js 5.0+ with Google OAuth
- **Session Storage**: Browser cookies (managed by NextAuth) + Redis backend
- **Components**: AuthButton, UserMetrics, AuthProvider
- **Hooks**: useAuthSession, useSession
- **API Client**: Authenticated fetch wrapper

### Backend Stack
- **Framework**: FastAPI (Python)
- **Middleware**: Custom auth middleware for session extraction
- **Metrics Storage**: Redis (same instance as caching)
- **Session Keys**:
  - `session:{user_id}` - Session data (30-day TTL)
  - `user:{user_id}:generations` - Counter (1-year TTL)
  - `user:{user_id}:feedback` - Hash of ratings (1-year TTL)
  - `user:{user_id}:last_active` - Timestamp (1-year TTL)

---

## File Structure

### New Frontend Files
```
src/
├── lib/
│   ├── auth.ts                 # NextAuth.js configuration
│   └── api-client.ts           # Authenticated API request utility
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts    # NextAuth.js API route
├── components/
│   ├── AuthProvider.tsx        # SessionProvider wrapper
│   ├── AuthButton.tsx          # Sign in/out button
│   └── UserMetrics.tsx         # Display metrics dashboard
└── hooks/
    └── useAuthSession.ts       # Auth session hook
```

### Updated Frontend Files
```
src/
├── app/
│   ├── layout.tsx              # Added AuthProvider wrapper
│   └── page.tsx                # (no changes needed)
├── components/
│   ├── Navbar.tsx              # Added AuthButton
│   └── FinanceStrategyResults.tsx # Added UserMetrics component
└── (others remain unchanged)
```

### New Backend Files
```
backend/
├── middleware/
│   └── auth.py                 # Session extraction middleware
└── utils/
    └── redis_manager.py        # User metrics Redis operations
```

### Updated Backend Files
```
backend/
├── api_server.py               # Added auth middleware, metrics endpoints
├── requirements.txt            # (already has redis)
```

### Configuration Files
```
env.example                      # Added NextAuth & Google OAuth secrets
package.json                     # Added next-auth dependency
```

---

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` in the root directory:

```bash
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google OAuth
# Get these from https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Backend
REDIS_URL=redis://localhost:6379/0
```

**Generate NEXTAUTH_SECRET safely:**
```bash
openssl rand -base64 32
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (OAuth client ID)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
6. Copy Client ID and Secret to `.env.local`

### 3. Install Dependencies

```bash
# Frontend
npm install

# Backend (if not already installed)
pip install redis
```

### 4. Verify Redis Connection

```bash
# Test Redis locally
redis-cli ping
# Should return: PONG

# Or with URL
redis-cli -u redis://localhost:6379/0 ping
```

---

## Usage Guide

### Frontend: Implementing Authentication

#### 1. Use Session in Components

```tsx
"use client";

import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Please sign in</div>;
  
  return <div>Welcome, {session.user?.name}!</div>;
}
```

#### 2. Use the Auth Hook

```tsx
import { useAuthSession } from "@/hooks/useAuthSession";

export default function MyComponent() {
  const { isAuthenticated, userId, getAuthHeaders } = useAuthSession();
  
  const handleRequest = async () => {
    const headers = getAuthHeaders();
    const response = await fetch("/api/some-endpoint", {
      headers,
    });
  };
  
  return isAuthenticated ? <div>Logged in as {userId}</div> : null;
}
```

#### 3. Use the API Client

```tsx
import { generateStrategy, submitFeedback } from "@/lib/api-client";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function StrategyForm() {
  const { userId } = useAuthSession();
  
  const handleGenerate = async () => {
    try {
      const result = await generateStrategy(
        "My startup...",
        userId,
      );
      
      // result includes:
      // - response: strategy data
      // - tokens_used: number
      // - remaining_trials: number
      // - user_metrics: { generation_count, average_rating, last_active }
      
      console.log("Generations this month:", result.user_metrics?.generation_count);
    } catch (error) {
      console.error("Generation failed:", error);
    }
  };
  
  const handleRating = async (strategyId: string, rating: number) => {
    const result = await submitFeedback(userId, strategyId, rating);
    console.log("Updated metrics:", result.metrics);
  };
  
  return (
    <>
      <button onClick={handleGenerate}>Generate</button>
    </>
  );
}
```

### Backend: API Endpoints

#### POST /api/generate
Generates a funding strategy. Requires valid user session.

**Request:**
```json
{
  "user_id": "user_abc123",
  "prompt": "We're an AI startup...",
  "input_overrides": { "teamSize": 5 }
}
```

**Response:**
```json
{
  "response": { /* strategy data */ },
  "tokens_used": 2500,
  "remaining_trials": 4,
  "user_metrics": {
    "generation_count": 3,
    "average_rating": 4.5,
    "last_active": "2024-12-18T10:30:00"
  }
}
```

#### POST /api/feedback
Submit feedback/rating for a strategy.

**Request:**
```json
{
  "user_id": "user_abc123",
  "strategy_id": "strat_123",
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded",
  "metrics": {
    "generation_count": 3,
    "average_rating": 4.7,
    "last_active": "2024-12-18T10:35:00"
  }
}
```

#### GET /api/metrics/{user_id}
Retrieve user metrics.

**Response:**
```json
{
  "generation_count": 3,
  "average_rating": 4.7,
  "last_active": "2024-12-18T10:35:00"
}
```

---

## Backend Code Examples

### Using the Metrics Manager

```python
from utils.redis_manager import get_metrics_manager

metrics_mgr = get_metrics_manager()

# Increment generation counter
count = metrics_mgr.increment_generation_count("user_123")

# Add feedback
metrics_mgr.add_feedback("user_123", "strat_456", 5)

# Get average rating
avg = metrics_mgr.get_average_rating("user_123")

# Update activity
metrics_mgr.update_last_active("user_123")

# Get all metrics
metrics = metrics_mgr.get_user_metrics("user_123")
```

### Using the Auth Middleware

```python
from fastapi import Request
from middleware.auth import get_user_id

@app.post("/api/protected")
async def protected_endpoint(request: Request):
    user_id = get_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Process request for user_id
    return {"user_id": user_id}
```

---

## Data Flow

### Authentication Flow

```
1. User clicks "Sign In" button
   ↓
2. NextAuth redirects to Google OAuth
   ↓
3. User approves and Google redirects back
   ↓
4. NextAuth callback creates JWT session
   ↓
5. Session stored as secure HTTP-only cookie
   ↓
6. Frontend receives session data
   ↓
7. API requests include Bearer token (user_id) in Authorization header
```

### Generation Flow

```
1. User fills form and clicks "Generate"
   ↓
2. Frontend calls /api/generate with:
      - user_id (from session)
      - prompt (form input)
   ↓
3. Backend auth middleware extracts user_id from header
   ↓
4. Backend generates strategy
   ↓
5. Backend increments generation counter in Redis
   ↓
6. Backend returns strategy + user_metrics
   ↓
7. Frontend displays strategy + UserMetrics component
   ↓
8. UserMetrics shows: "You've generated 3 strategies"
```

### Feedback Flow

```
1. User rates strategy (1-5 stars)
   ↓
2. Frontend calls /api/feedback with:
      - user_id
      - strategy_id
      - rating
   ↓
3. Backend stores rating in Redis hash
   ↓
4. Backend recalculates average rating
   ↓
5. Backend returns updated metrics
   ↓
6. Frontend updates display
```

---

## Security Considerations

### Session Security
- **HttpOnly Cookies**: NextAuth stores sessions in secure, HttpOnly cookies
- **CSRF Protection**: NextAuth includes CSRF tokens
- **Session TTL**: 30 days (configurable in `authOptions.session.maxAge`)

### API Authentication
- **Bearer Tokens**: User ID sent as Bearer token in Authorization header
- **User Isolation**: Each user can only access their own metrics
- **Redis TTL**: User data automatically expires after 1 year

### Environment Secrets
- **NEXTAUTH_SECRET**: Generate securely with `openssl rand -base64 32`
- **Google OAuth**: Secrets never exposed to frontend
- **Redis URL**: Should use authentication if in production

---

## Monitoring & Debugging

### Check User Sessions

```bash
# Redis CLI
redis-cli -u redis://localhost:6379/0

# View all user keys
KEYS user:*

# Get user metrics
GET user:user_123:generations
HGETALL user:user_123:feedback
GET user:user_123:last_active

# View active sessions
KEYS session:*
GET session:user_123
```

### Backend Logs

```bash
# Run with debug logging
DEBUG=* npm run dev

# FastAPI logs will show:
# [AUTH] User ID from Authorization header: user_123
# [METRICS] Generation tracked for user_123
# [METRICS] Retrieved metrics for user_123
```

### Frontend Session Issues

```tsx
// Debug session in browser console
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log)
```

---

## Troubleshooting

### Issue: "Unauthorized" on /api/generate

**Cause**: User ID not sent in request

**Solution**:
1. Check that user is logged in: `console.log(session)` in component
2. Verify Bearer token in network requests (DevTools → Network)
3. Check NEXTAUTH_URL matches your domain

### Issue: Metrics not updating

**Cause**: Redis connection failed

**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL in `.env.local`
3. Look at backend logs for Redis errors

### Issue: Google OAuth redirect fails

**Cause**: Callback URL mismatch

**Solution**:
1. Check Google Cloud Console → Authorized redirect URIs
2. Verify NEXTAUTH_URL matches your domain
3. Ensure `/api/auth/callback/google` is in the URI list

### Issue: "TypeError: Cannot read property 'user' of null"

**Cause**: Accessing session before it's loaded

**Solution**:
```tsx
// Always check loading state first
if (status === "loading") return <Loading />;
if (!session) return <LoginPrompt />;

// Now safe to use session
const userId = session.user.id;
```

---

## Performance Optimization

### Caching User Metrics

```tsx
// Use SWR or React Query for cached metrics
import useSWR from "swr";

export default function MetricsDisplay({ userId }) {
  const { data: metrics } = useSWR(
    userId ? `/api/metrics/${userId}` : null,
    fetcher,
    { revalidateOnFocus: false } // Don't refresh on every focus
  );
  
  return <div>{metrics?.generation_count}</div>;
}
```

### Debounce Rating Submissions

```tsx
import { debounce } from "lodash";

const submitRatingDebounced = debounce(
  (strategyId, rating) => submitFeedback(userId, strategyId, rating),
  1000 // Wait 1 second before sending
);
```

---

## Future Enhancements

1. **Email Notifications**: Notify users of new strategies
2. **Rate Limiting**: Limit generations per user per day
3. **Leaderboard**: Show top-rated strategies across users
4. **Strategy History**: Save and allow users to compare strategies
5. **Advanced Analytics**: Track strategy effectiveness over time
6. **Social Sharing**: Allow users to share strategies

---

## Support & Questions

For issues or questions:
1. Check logs: Backend logs (`[AUTH]`, `[METRICS]`), Browser console
2. Review this guide's Troubleshooting section
3. Verify all environment variables are set
4. Test Redis connection independently
5. Check Google OAuth configuration

---

**Last Updated**: December 18, 2024
**Version**: 1.0.0
