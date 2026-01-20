# TikTok OAuth Redirect URI Fix Guide

## Problem
You're getting a `redirect_uri` error from TikTok OAuth. This happens when the redirect URI in your code doesn't exactly match what's configured in your TikTok app settings.

## Solution Steps

### 1. Get Your Exact Vercel URL

Your Vercel deployment URL should be something like:
```
https://your-app-name.vercel.app
```

### 2. Configure Redirect URI in TikTok App Settings

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Navigate to your app
3. Go to **Basic Information** → **Platform Information**
4. Under **Redirect URI**, add:
   ```
   https://your-app-name.vercel.app/auth/tiktok/callback
   ```
   
   **Important**: 
   - Use `https://` (not `http://`)
   - No trailing slash
   - Exact match including `/auth/tiktok/callback`

### 3. Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `VITE_TIKTOK_REDIRECT_URI`
   - **Value**: `https://your-app-name.vercel.app/auth/tiktok/callback`
   - **Environment**: Production (and Preview if needed)

### 4. Update Supabase Edge Function Secret

Update the redirect URI secret in Supabase to match:

```bash
supabase secrets set TIKTOK_REDIRECT_URI=https://your-app-name.vercel.app/auth/tiktok/callback
```

### 5. Redeploy

After setting the environment variable, redeploy your Vercel app so it picks up the new variable.

## Verification Checklist

- [ ] Redirect URI added in TikTok app settings (exact match)
- [ ] `VITE_TIKTOK_REDIRECT_URI` set in Vercel environment variables
- [ ] `TIKTOK_REDIRECT_URI` updated in Supabase secrets
- [ ] App redeployed after environment variable changes
- [ ] Using HTTPS (not HTTP) in production
- [ ] No trailing slash in redirect URI

## Common Mistakes

1. **Trailing slash**: `https://app.com/auth/tiktok/callback/` ❌ vs `https://app.com/auth/tiktok/callback` ✅
2. **HTTP vs HTTPS**: Using `http://` in production ❌
3. **Case sensitivity**: URLs are case-sensitive
4. **Missing path**: Just `https://app.com` ❌ vs `https://app.com/auth/tiktok/callback` ✅
5. **Different domains**: Using `localhost` redirect URI in production ❌

## Testing

After fixing, test the flow:
1. Go to your deployed app's dashboard
2. Click "Connect" on TikTok
3. You should be redirected to TikTok authorization
4. After authorizing, you should be redirected back to your app

If you still get errors, check the browser console and network tab to see the exact redirect URI being sent.
