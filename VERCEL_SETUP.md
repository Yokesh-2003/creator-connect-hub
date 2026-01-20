# Vercel Deployment Setup for TikTok OAuth

## Your Vercel URL
**Production URL**: `https://creator-connect-hub-gamma.vercel.app`

## Step-by-Step Configuration

### 1. Configure Redirect URI in TikTok Developer Portal

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Navigate to your app: **GameOfCreators Dev** → **Sandbox** (or **Production** if approved)
3. Go to **Basic Information** section
4. Scroll down to find **Redirect URI** or **OAuth Settings**
5. Add this exact redirect URI:
   ```
   https://creator-connect-hub-gamma.vercel.app/auth/tiktok/callback
   ```
   ⚠️ **Important**: 
   - Must be exact match (no trailing slash)
   - Must use `https://` (not `http://`)
   - Must include the full path `/auth/tiktok/callback`

6. Click **"Apply changes"** button (red button in top right)

### 2. Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **creator-connect-hub**
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   **For Production:**
   - **Name**: `VITE_TIKTOK_REDIRECT_URI`
   - **Value**: `https://creator-connect-hub-gamma.vercel.app/auth/tiktok/callback`
   - **Environment**: Production ✅

   **For Preview (optional):**
   - **Name**: `VITE_TIKTOK_REDIRECT_URI`
   - **Value**: `https://creator-connect-hub-gamma.vercel.app/auth/tiktok/callback`
   - **Environment**: Preview ✅

   **Also ensure these are set:**
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon key
   - `VITE_TIKTOK_CLIENT_ID` - Your TikTok Client Key
   - `VITE_LINKEDIN_CLIENT_ID` - Your LinkedIn Client ID (if using)

### 3. Update Supabase Edge Function Secrets

Run these commands in your terminal (with Supabase CLI):

```bash
# Set TikTok redirect URI
supabase secrets set TIKTOK_REDIRECT_URI=https://creator-connect-hub-gamma.vercel.app/auth/tiktok/callback

# Verify secrets are set
supabase secrets list
```

### 4. Redeploy Your Vercel App

After setting environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### 5. Verify Configuration

After redeployment:

1. Open your deployed app: https://creator-connect-hub-gamma.vercel.app
2. Go to Dashboard
3. Open browser Developer Tools (F12) → Console tab
4. Click "Connect" on TikTok
5. Check console for log: `TikTok OAuth redirect URI: https://creator-connect-hub-gamma.vercel.app/auth/tiktok/callback`
6. This should match exactly what you configured in TikTok Developer Portal

## Troubleshooting

### Still Getting Redirect URI Error?

1. **Double-check TikTok settings:**
   - Go to TikTok Developer Portal
   - Verify the redirect URI is saved (check for typos)
   - Make sure you clicked "Apply changes"

2. **Check Vercel environment variables:**
   - Go to Settings → Environment Variables
   - Verify `VITE_TIKTOK_REDIRECT_URI` is set correctly
   - Make sure it's enabled for Production environment

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

4. **Check browser console:**
   - Look for the exact redirect URI being used
   - Compare it with what's in TikTok settings

5. **Verify Supabase secrets:**
   ```bash
   supabase secrets list
   ```
   Should show `TIKTOK_REDIRECT_URI` with correct value

### Common Issues

- **Trailing slash**: `https://...vercel.app/auth/tiktok/callback/` ❌ vs `https://...vercel.app/auth/tiktok/callback` ✅
- **HTTP vs HTTPS**: Always use `https://` in production
- **Case sensitivity**: URLs are case-sensitive
- **Environment variable not loaded**: Must redeploy after adding environment variables

## Additional URLs Configured

Your TikTok app also has these URLs configured (which is good):
- Terms of Service: `https://creator-connect-hub-gamma.vercel.app/terms` ✅
- Privacy Policy: `https://creator-connect-hub-gamma.vercel.app/privacy` ✅
- Web/Desktop URL: `https://creator-connect-hub-gamma.vercel.app` ✅

These pages have been created and are accessible at those URLs.

## Next Steps

Once the redirect URI is configured correctly:
1. Test TikTok OAuth connection from your deployed app
2. Verify the callback redirects back to your app
3. Check that the account connection is saved in your dashboard

If you still encounter issues, check the browser console and network tab for detailed error messages.
