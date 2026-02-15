# CORS Configuration Guide

## Problem
When frontend tries to call backend API, you get:
```
Access to fetch at 'https://backend-url.com/api/...' from origin 'https://frontend-url.com' 
has been blocked by CORS policy
```

## Solution

### For Railway Deployment

1. **Go to Railway Dashboard**
2. Click your **Node.js service**
3. Go to **Variables** tab
4. Add or Update:

**Option A: Single Frontend**
```
FRONTEND_ORIGIN=https://assamcrafts.com
```

**Option B: Multiple Frontends**
```
ALLOWED_ORIGINS=https://assamcrafts.com,https://another-domain.com,http://localhost:5173
```

> Note: `localhost:5173` is for local development

5. **Redeploy** (usually automatic when changing variables)

### For Local Development

Your `.env` should have:
```
FRONTEND_ORIGIN=http://localhost:5173
```

Or if using multiple:
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## How It Works

The backend checks if the request's `Origin` header matches the allowed origins:

```javascript
allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN).split(",")

// Request from origin is checked against this list
if (allowedOrigins.includes(requestOrigin)) {
  // ✅ Request allowed
} else {
  // ❌ CORS error
}
```

## Troubleshooting

**Still getting CORS error?**
1. Check Railway Variables → exact spelling of domain
2. Include `https://` or `http://` prefix
3. Don't include trailing slash
4. Redeploy the backend after updating variables
5. Clear browser cache (Ctrl+Shift+Delete)

**For Development**
- Make sure backend runs with `FRONTEND_ORIGIN=http://localhost:5173`
- Or `ALLOWED_ORIGINS=http://localhost:5173`

**For Production**
- Always use `https://` prefix
- Don't use wildcards in production
- List all frontend domains explicitly
