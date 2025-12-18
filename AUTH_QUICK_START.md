# Quick Start: Authentication Setup for FinIQ

## 5-Minute Setup

### 1. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Output example: K7x5m2p9L8w3Q1R6t5Y9u2V3w4X5y6Z7
```

### 2. Get Google OAuth Credentials

1. Visit: https://console.cloud.google.com/
2. Create new project
3. Enable Google+ API
4. Go to: Credentials → Create OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret

### 3. Configure Environment

Create `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=K7x5m2p9L8w3Q1R6t5Y9u2V3w4X5y6Z7
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
REDIS_URL=redis://localhost:6379/0
```

### 4. Install & Run

```bash
# Install packages
npm install

# Run development server
npm run dev

# Backend should already be running
# If not: cd backend && python api_server.py
```

### 5. Test It

1. Open http://localhost:3000
2. Click "Sign In" button
3. Sign in with Google
4. Generate a strategy
5. Check metrics display

---

## File Checklist

✅ **New Files Created:**
- `src/lib/auth.ts` - NextAuth config
- `src/app/api/auth/[...nextauth]/route.ts` - Auth endpoint
- `src/components/AuthProvider.tsx` - Session wrapper
- `src/components/AuthButton.tsx` - Sign in button
- `src/components/UserMetrics.tsx` - Metrics display
- `src/hooks/useAuthSession.ts` - Auth hook
- `src/lib/api-client.ts` - Authenticated API calls
- `backend/middleware/auth.py` - Auth middleware
- `backend/utils/redis_manager.py` - Metrics storage

✅ **Files Updated:**
- `src/app/layout.tsx` - Added AuthProvider
- `src/components/Navbar.tsx` - Added AuthButton
- `src/components/FinanceStrategyResults.tsx` - Added UserMetrics
- `backend/api_server.py` - Added auth, metrics endpoints
- `package.json` - Added next-auth
- `env.example` - Added secrets

---

## Key Files Reference

### Authentication Entry Point
→ [src/lib/auth.ts](src/lib/auth.ts)

### Session Provider Setup
→ [src/components/AuthProvider.tsx](src/components/AuthProvider.tsx)

### Sign In/Out Button
→ [src/components/AuthButton.tsx](src/components/AuthButton.tsx)

### User Metrics Display
→ [src/components/UserMetrics.tsx](src/components/UserMetrics.tsx)

### Backend Auth Middleware
→ [backend/middleware/auth.py](backend/middleware/auth.py)

### Backend Metrics Manager
→ [backend/utils/redis_manager.py](backend/utils/redis_manager.py)

### API Endpoints
→ [backend/api_server.py](backend/api_server.py) (lines ~100-240)

### Full Documentation
→ [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md)

---

## API Examples

### Generate Strategy with Metrics
```tsx
import { generateStrategy } from "@/lib/api-client";
import { useAuthSession } from "@/hooks/useAuthSession";

const { userId } = useAuthSession();
const result = await generateStrategy("My startup...", userId);

// Returns: { response, tokens_used, remaining_trials, user_metrics }
console.log(result.user_metrics.generation_count);
```

### Submit Rating
```tsx
import { submitFeedback } from "@/lib/api-client";

const result = await submitFeedback(userId, strategyId, 5);
console.log("New avg rating:", result.metrics.average_rating);
```

### Get Metrics
```tsx
import { getUserMetrics } from "@/lib/api-client";

const metrics = await getUserMetrics(userId);
// { generation_count: 3, average_rating: 4.5, last_active: "2024-12-18T..." }
```

---

## Redis Commands for Testing

```bash
redis-cli -u redis://localhost:6379/0

# View user data
KEYS user:*

# Get generation count
GET user:user_123:generations

# Get feedback ratings
HGETALL user:user_123:feedback

# Get last active timestamp
GET user:user_123:last_active

# Delete user data (for testing)
DEL user:user_123:generations
DEL user:user_123:feedback
DEL user:user_123:last_active
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Google sign-in not working" | Check GOOGLE_CLIENT_ID in .env.local, verify redirect URI in Google Console |
| "Metrics not showing" | Verify REDIS_URL, check Redis is running with `redis-cli ping` |
| "Session error" | Ensure NEXTAUTH_SECRET is set, try clearing browser cookies |
| "Backend returns 401" | Check Authorization header in network tab, verify user_id format |
| "Redis connection timeout" | Verify REDIS_URL format, check Redis service is running |

---

## Development Tips

1. **Debug Session**:
   ```tsx
   const { data: session } = useSession();
   console.log("Session:", session);
   ```

2. **Monitor Backend Logs**:
   ```bash
   # Look for [AUTH] and [METRICS] tags
   cd backend && python api_server.py
   ```

3. **Check Redis Keys**:
   ```bash
   redis-cli KEYS "user:*" | head -20
   ```

4. **Test API Directly**:
   ```bash
   curl -X POST http://localhost:8000/api/generate \
     -H "Authorization: Bearer user_123" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"user_123","prompt":"test"}'
   ```

---

## Production Checklist

- [ ] Set strong NEXTAUTH_SECRET (not development value)
- [ ] Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from production OAuth app
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Use Redis with authentication in production
- [ ] Enable HTTPS (required for OAuth)
- [ ] Add production callback URIs to Google Console
- [ ] Set up monitoring for Redis connection
- [ ] Configure email notifications (optional)
- [ ] Test complete auth flow in staging first
- [ ] Set up analytics/logging for auth events

---

**Next Steps:**
1. Follow the 5-minute setup above
2. Test signing in and generating a strategy
3. See USER_METRICS displayed on results page
4. Read [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) for detailed docs

Questions? Check the Troubleshooting section in [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md).
