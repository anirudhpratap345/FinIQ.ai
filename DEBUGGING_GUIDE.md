# FinIQ Auth & Metrics - Debugging Guide

## Common Issues & Solutions

### 🔴 Authentication Issues

#### Issue: "Sign In" button doesn't work
**Symptoms**: Clicking button does nothing or shows blank popup

**Debugging Steps**:
```bash
# 1. Check browser console for errors
# Open DevTools → Console, look for red error messages

# 2. Verify NextAuth route is working
curl http://localhost:3000/api/auth/signin

# 3. Check environment variables
echo $GOOGLE_CLIENT_ID
echo $NEXTAUTH_URL
```

**Solutions**:
- [ ] Verify NEXTAUTH_URL matches your domain exactly
- [ ] Check GOOGLE_CLIENT_ID is set correctly
- [ ] Ensure .env.local is in root directory (not src/)
- [ ] Restart development server after .env.local changes
- [ ] Clear browser cookies and try again

**More Help**: Google OAuth issues → check Google Cloud Console

---

#### Issue: "Google Sign-In Popup Closes Immediately"
**Symptoms**: Google OAuth window opens then closes without signing in

**Debugging Steps**:
```bash
# 1. Check browser console for errors
# Look for: "Error: redirect_uri_mismatch"

# 2. Verify redirect URI in Google Console
# Go to: https://console.cloud.google.com/apis/credentials
```

**Solutions**:
- [ ] Add exact redirect URI to Google OAuth settings:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://yourdomain.com/api/auth/callback/google`
- [ ] Check for trailing slashes (must match exactly)
- [ ] Wait 5 minutes for Google settings to sync
- [ ] Try incognito/private browser window

---

#### Issue: "Session Lost After Refresh"
**Symptoms**: Logged in, but after page refresh shows as logged out

**Debugging Steps**:
```bash
# 1. Check if cookie is stored
# DevTools → Application → Cookies → localhost:3000
# Look for: next-auth.session-token

# 2. Test session endpoint
curl http://localhost:3000/api/auth/session

# 3. Check NEXTAUTH_SECRET
echo $NEXTAUTH_SECRET
```

**Solutions**:
- [ ] Ensure NEXTAUTH_SECRET is set (not empty)
- [ ] NEXTAUTH_SECRET should be 32+ characters
- [ ] Regenerate secret: `openssl rand -base64 32`
- [ ] Clear cookies and login again
- [ ] Check browser allows third-party cookies (needed for OAuth)

---

### 🟠 Metrics Issues

#### Issue: "Metrics Not Showing"
**Symptoms**: Generation count stays 0, no metrics display

**Debugging Steps**:
```bash
# 1. Check if Redis is running
redis-cli ping
# Should output: PONG

# 2. Check Redis connection
redis-cli -u redis://localhost:6379/0 ping

# 3. Check metrics in Redis
redis-cli KEYS "user:*"
redis-cli GET "user:user_123:generations"

# 4. Check backend logs for [METRICS] entries
# Look for: "[METRICS] Generation tracked for user"
```

**Solutions**:
- [ ] Start Redis: `redis-server` (or check if it's running)
- [ ] Verify REDIS_URL in .env.local matches running Redis
- [ ] Check backend logs for connection errors
- [ ] Ensure user is logged in (has user.id in session)
- [ ] Clear browser cache and try generating again

**Testing**:
```bash
# Manually increment counter
redis-cli -u redis://localhost:6379/0
SET user:test_user_123:generations 5

# Verify
GET user:test_user_123:generations
# Should return: "5"
```

---

#### Issue: "Average Rating Shows 0"
**Symptoms**: Even after submitting ratings, average stays 0

**Debugging Steps**:
```bash
# 1. Check if ratings are stored
redis-cli HGETALL user:USER_ID:feedback

# 2. Check backend response
# In DevTools → Network, look at /api/feedback response
# Should include: "metrics": { "average_rating": X.X }

# 3. Check user ID consistency
# Make sure same user_id used for generation and feedback
```

**Solutions**:
- [ ] Verify user_id is consistent (check Network tab)
- [ ] Ensure ratings endpoint is being called
- [ ] Check backend logs for feedback errors
- [ ] Manually test with Redis CLI:
  ```bash
  redis-cli HSET user:test:feedback strat_1 5
  redis-cli HSET user:test:feedback strat_2 4
  redis-cli HGETALL user:test:feedback
  ```

---

### 🟡 Backend Issues

#### Issue: "POST /api/generate Returns 401"
**Symptoms**: API returns "Unauthorized" error

**Debugging Steps**:
```bash
# 1. Check Authorization header in request
# DevTools → Network → generate request → Headers
# Look for: Authorization: Bearer user_123

# 2. Test with curl
curl -X POST http://localhost:8000/api/generate \
  -H "Authorization: Bearer user_test" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_test","prompt":"test"}'

# 3. Check backend logs
# Look for: "[AUTH] No session found in request"
```

**Solutions**:
- [ ] Ensure user is logged in before calling API
- [ ] Check that Bearer token is being sent (requires session)
- [ ] Verify user_id in request body matches Bearer token
- [ ] Check backend auth middleware is enabled
- [ ] Review [backend/middleware/auth.py](backend/middleware/auth.py)

---

#### Issue: "Redis Connection Error in Backend"
**Symptoms**: Backend logs show Redis connection failure

**Debugging Steps**:
```bash
# 1. Test Redis connection
redis-cli -u redis://localhost:6379/0 ping
# Should return: PONG

# 2. Check REDIS_URL format
# Correct: redis://localhost:6379/0
# Wrong: redis://localhost:6379 (missing database number)

# 3. Check Redis is listening
lsof -i :6379
# Should show redis-server process

# 4. Check backend logs
# Look for: "[ERROR] Failed to connect to Redis"
```

**Solutions**:
- [ ] Start Redis: `redis-server`
- [ ] Verify REDIS_URL in backend .env or env.example
- [ ] Add /0 to REDIS_URL (selects database 0)
- [ ] Test connection: `redis-cli -u YOUR_REDIS_URL ping`
- [ ] Check Redis isn't password protected (or use auth in URL)

**Redis URL Formats**:
```
Local: redis://localhost:6379/0
With Auth: redis://user:password@host:port/0
Docker: redis://redis-container:6379/0
```

---

#### Issue: "Backend Crashes with 'ModuleNotFoundError'"
**Symptoms**: Backend startup fails with import error

**Debugging Steps**:
```bash
# 1. Check Python version
python --version  # Should be 3.8+

# 2. Check installed packages
pip list | grep -i redis
pip list | grep -i fastapi

# 3. Try importing manually
python -c "from utils.redis_manager import get_metrics_manager"
```

**Solutions**:
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Ensure requirements.txt includes redis
- [ ] Check Python is in PATH
- [ ] Use virtual environment: `python -m venv venv && source venv/bin/activate`
- [ ] On Windows: `venv\Scripts\activate`

---

### 🔵 Frontend Issues

#### Issue: "useSession Returns null"
**Symptoms**: `session` is always null even after login

**Debugging Steps**:
```tsx
// 1. Check if component is wrapped with SessionProvider
// Parent should be: <AuthProvider><YourComponent /></AuthProvider>

// 2. Debug in component
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
console.log("Status:", status);
console.log("Session:", session);

// 2. Check status values
// "loading" → checking session
// "authenticated" → user logged in
// "unauthenticated" → no session
```

**Solutions**:
- [ ] Wrap component with `<AuthProvider>` in parent
- [ ] Check status is "authenticated" before using session
- [ ] Add loading state for "loading" status
- [ ] Verify SessionProvider is in layout.tsx
- [ ] Clear browser cookies and logout/login

**Example Fix**:
```tsx
import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Loading />;
  if (status === "unauthenticated") return <LoginPrompt />;
  
  return <div>Welcome, {session?.user?.name}</div>;
}
```

---

#### Issue: "AuthButton Shows 'Sign In' But Should Show Username"
**Symptoms**: Even after logging in, button still shows "Sign In"

**Debugging Steps**:
```bash
# 1. Check if SessionProvider is active
# Look at layout.tsx for <AuthProvider> wrapper

# 2. Check if cookies are saved
# DevTools → Application → Cookies
# Look for: next-auth.session-token

# 3. Check session endpoint
curl http://localhost:3000/api/auth/session
# Should return session object, not empty {}
```

**Solutions**:
- [ ] Ensure AuthProvider wraps entire app (in layout.tsx)
- [ ] Check that AuthButton is inside AuthProvider component tree
- [ ] Force page reload: Ctrl+Shift+R (hard refresh)
- [ ] Clear cookies and login again
- [ ] Verify NEXTAUTH_SECRET is set

---

#### Issue: "UserMetrics Component Shows Login Prompt When Logged In"
**Symptoms**: Metrics component still shows "Sign in to track progress"

**Debugging Steps**:
```bash
# 1. Check session availability
# In DevTools → Console:
import { getSession } from "next-auth/react";
getSession().then(console.log)

# 2. Check component hierarchy
# UserMetrics should be inside AuthProvider

# 3. Check if metrics are being passed
// In FinanceStrategyResults:
console.log("Metrics prop:", userMetrics);
```

**Solutions**:
- [ ] Verify session exists: `const { data: session } = useSession()`
- [ ] Check UserMetrics receives session correctly
- [ ] Ensure FinanceStrategyResults passes userMetrics prop
- [ ] Check API response includes user_metrics field
- [ ] Manual test:
  ```bash
  redis-cli GET user:USER_ID:generations
  ```

---

### 🟣 Network/API Issues

#### Issue: "CORS Error When Calling Backend"
**Symptoms**: Error: "Access to XMLHttpRequest ... blocked by CORS policy"

**Debugging Steps**:
```bash
# 1. Check CORS configuration
# Look at backend/api_server.py for CORSMiddleware

# 2. Check request origin
# DevTools → Network → generate → Headers
# Look for: Origin: http://localhost:3000

# 3. Test endpoint directly
curl -X GET http://localhost:8000/api/metrics/test
```

**Solutions**:
- [ ] Verify origin in CORS allowed_origins list
- [ ] Check frontend URL matches exactly
- [ ] Add to backend CORS:
  ```python
  origins = [
      "http://localhost:3000",
      "https://yourdomain.com",
  ]
  ```
- [ ] Restart backend after changes

---

#### Issue: "Network Request Hangs or Times Out"
**Symptoms**: API calls never complete, request stays pending

**Debugging Steps**:
```bash
# 1. Test backend is running
curl http://localhost:8000/api/health

# 2. Check network in DevTools
# Look at time spent (might be slow backend)

# 3. Check backend logs
# Look for processing time or errors

# 4. Test with timeout
curl --max-time 5 http://localhost:8000/api/generate
```

**Solutions**:
- [ ] Ensure backend is running: `python api_server.py`
- [ ] Check backend port (default 8000)
- [ ] Verify NEXT_PUBLIC_BACKEND_URL if using custom port
- [ ] Check for infinite loops in chain_manager
- [ ] Add timeout to API calls:
  ```tsx
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000); // 10s timeout
  fetch(url, { signal: controller.signal });
  ```

---

## 🛠️ Verification Checklist

### Pre-Launch Checklist

```bash
# 1. Environment Setup
[ ] NEXTAUTH_URL is set
[ ] NEXTAUTH_SECRET is set (32+ chars)
[ ] GOOGLE_CLIENT_ID is set
[ ] GOOGLE_CLIENT_SECRET is set
[ ] REDIS_URL is set

# 2. Frontend Verification
[ ] npm install completed
[ ] npm run dev starts without errors
[ ] AuthButton shows in navbar
[ ] Can click "Sign In" button

# 3. Backend Verification
[ ] Redis is running (redis-cli ping = PONG)
[ ] Backend starts: python api_server.py
[ ] Health check works: curl http://localhost:8000/api/health
[ ] Auth middleware is loaded

# 4. Authentication Flow
[ ] Click "Sign In" opens Google OAuth
[ ] Can sign in with Google account
[ ] Redirects back to home page
[ ] AuthButton shows user email
[ ] Session persists on page refresh

# 5. Generation & Metrics
[ ] Can generate strategy while logged in
[ ] API response includes user_metrics
[ ] UserMetrics component displays
[ ] Generation count shows correct number
[ ] Redis contains user:*:generations keys
```

---

## 🐛 Browser Developer Tools Tips

### Check Session
```javascript
// In DevTools Console
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => console.log('Session:', session))
```

### Monitor API Calls
```
1. Open DevTools → Network tab
2. Generate a strategy
3. Look for:
   - POST /api/generate
   - Check Status: 200 (success) or 401 (auth error)
   - Check Headers for Authorization: Bearer ...
   - Check Response for user_metrics
```

### Check Cookies
```
1. Open DevTools → Application tab
2. Click Cookies → http://localhost:3000
3. Look for: next-auth.session-token
4. Check: Expires timestamp (should be 30 days from now)
```

### Check LocalStorage
```javascript
// In DevTools Console
Object.entries(localStorage).forEach(([k,v]) => 
  console.log(k, v.substring(0, 50) + '...')
)
```

---

## 📊 Redis Inspection

### View All User Keys
```bash
redis-cli KEYS "user:*"
```

### View Specific User Data
```bash
# Generation count
redis-cli GET user:user_123:generations

# Feedback ratings (hash)
redis-cli HGETALL user:user_123:feedback

# Last active time
redis-cli GET user:user_123:last_active

# All keys for a user
redis-cli KEYS "user:user_123:*"
```

### Clear User Data (for testing)
```bash
# Delete single counter
redis-cli DEL user:user_123:generations

# Delete all user data
redis-cli KEYS "user:user_123:*" | xargs redis-cli DEL

# Clear everything (⚠️ be careful!)
redis-cli FLUSHDB
```

---

## 📝 Logging & Debugging

### Enable Debug Logging

**Frontend**:
```tsx
// In components
const [debug, setDebug] = useState(true);

useEffect(() => {
  if (debug) {
    const { data: session } = useSession();
    console.log('[DEBUG] Session:', session);
  }
}, [debug]);
```

**Backend**:
```python
# In api_server.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Look for [AUTH], [METRICS], [ERROR] tags in logs
```

### Search Backend Logs
```bash
# Run backend and pipe to grep
python api_server.py 2>&1 | grep -i "auth\|metrics\|error"

# Or save to file
python api_server.py > backend.log 2>&1
tail -f backend.log
```

---

## 🔗 Useful Links

- **NextAuth.js Docs**: https://next-auth.js.org/
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Redis Docs**: https://redis.io/docs/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Our Guides**: 
  - [AUTH_QUICK_START.md](AUTH_QUICK_START.md)
  - [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md)

---

## 📞 Getting Help

### Before Contacting Support

1. ✅ Check this guide (you might find your issue here)
2. ✅ Check browser console for errors
3. ✅ Check backend logs for [ERROR] entries
4. ✅ Verify all environment variables are set
5. ✅ Ensure Redis is running
6. ✅ Try hard refresh: Ctrl+Shift+R
7. ✅ Clear cookies and logout/login again

### Information to Gather

When reporting issues, include:
- Full error message (from console or logs)
- Steps to reproduce
- Environment details (OS, Node version, Python version)
- What you've already tried
- Screenshot if UI issue

---

**Last Updated**: December 18, 2024
**Version**: 1.0.0
