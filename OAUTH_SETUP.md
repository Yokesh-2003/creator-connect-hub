# OAuth Setup Guide for Game of Creators

This guide will help you set up TikTok and LinkedIn OAuth integrations for the Game of Creators platform.

## Prerequisites

1. TikTok Developer Account
2. LinkedIn Developer Account
3. Supabase Project (with Edge Functions enabled)

## TikTok OAuth Setup

### 1. Create TikTok App

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Click "Create an App"
4. Fill in the app details:
   - App Name: Your app name
   - Category: Select appropriate category
   - Description: Brief description of your app
5. Request access to:
   - **Login Kit (OAuth)**: For user authentication
   - **Video list & basic analytics**: For fetching video metrics

### 2. Configure Redirect URI

In your TikTok app settings, add the redirect URI:
```
https://yourdomain.com/auth/tiktok/callback
```

For local development:
```
http://localhost:8080/auth/tiktok/callback
```

### 3. Get Credentials

After approval, you'll receive:
- **Client Key** (Client ID)
- **Client Secret**

### 4. Set Environment Variables

**Frontend (.env or .env.local):**
```env
VITE_TIKTOK_CLIENT_ID=your_tiktok_client_key
```

**Supabase Edge Function Secrets:**
```bash
# Using Supabase CLI
supabase secrets set TIKTOK_CLIENT_ID=your_tiktok_client_key
supabase secrets set TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
supabase secrets set TIKTOK_REDIRECT_URI=https://yourdomain.com/auth/tiktok/callback
```

## LinkedIn OAuth Setup

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Sign in with your LinkedIn account
3. Click "Create app"
4. Fill in the app details:
   - App name: Your app name
   - LinkedIn Page: Select or create a page
   - Privacy policy URL: Your privacy policy URL
   - App logo: Upload a logo

### 2. Request Products

In your LinkedIn app, request access to:
- **Sign In with LinkedIn using OpenID Connect**
- **Marketing Developer Platform** (for posting/analytics)

### 3. Configure Redirect URLs

In "Auth" tab, add authorized redirect URLs:
```
https://yourdomain.com/auth/linkedin/callback
```

For local development:
```
http://localhost:8080/auth/linkedin/callback
```

### 4. Set OAuth 2.0 Scopes

Add these scopes:
- `openid`
- `profile`
- `email`
- `w_member_social` (for posting content)

### 5. Get Credentials

In the "Auth" tab, you'll find:
- **Client ID**
- **Client Secret**

### 6. Set Environment Variables

**Frontend (.env or .env.local):**
```env
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

**Supabase Edge Function Secrets:**
```bash
supabase secrets set LINKEDIN_CLIENT_ID=your_linkedin_client_id
supabase secrets set LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
supabase secrets set LINKEDIN_REDIRECT_URI=https://yourdomain.com/auth/linkedin/callback
```

## Supabase Edge Functions Setup

### 1. Deploy Edge Functions

Make sure you have Supabase CLI installed and configured:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy tiktok-oauth-callback
supabase functions deploy linkedin-oauth-callback
```

### 2. Set Function Secrets

As mentioned above, set the OAuth secrets using:
```bash
supabase secrets set SECRET_NAME=secret_value
```

## Environment Variables Summary

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_TIKTOK_CLIENT_ID=your_tiktok_client_key
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

### Supabase Edge Functions (via `supabase secrets`)
```
TIKTOK_CLIENT_ID
TIKTOK_CLIENT_SECRET
TIKTOK_REDIRECT_URI
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
LINKEDIN_REDIRECT_URI
```

## Testing OAuth Flow

### TikTok

1. Go to `/dashboard`
2. Click "Connect" on the TikTok card
3. You'll be redirected to TikTok for authorization
4. After authorization, you'll be redirected back to `/auth/tiktok/callback`
5. The account should now appear as connected in the dashboard

### LinkedIn

1. Go to `/dashboard`
2. Click "Connect" on the LinkedIn card
3. You'll be redirected to LinkedIn for authorization
4. After authorization, you'll be redirected back to `/auth/linkedin/callback`
5. The account should now appear as connected in the dashboard

## Troubleshooting

### TikTok OAuth Issues

- **"Invalid redirect URI"**: Make sure the redirect URI in TikTok app settings exactly matches the one in your code
- **"Access denied"**: Ensure you've requested the correct permissions/scopes in your TikTok app
- **"Invalid client_key"**: Double-check your `VITE_TIKTOK_CLIENT_ID` is set correctly

### LinkedIn OAuth Issues

- **"Invalid redirect_uri"**: Verify the redirect URI is added in LinkedIn app "Auth" tab
- **"Insufficient permissions"**: Ensure you've requested access to "Sign In with LinkedIn" and other necessary products
- **"Invalid client_id"**: Verify your `VITE_LINKEDIN_CLIENT_ID` environment variable

### Edge Function Issues

- **"Function not found"**: Make sure you've deployed the functions using `supabase functions deploy`
- **"Missing secrets"**: Verify all secrets are set using `supabase secrets list`
- **"CORS errors"**: Check that your Supabase project has CORS properly configured

## API Endpoints Reference

### TikTok API
- Authorization: `https://www.tiktok.com/v2/auth/authorize/`
- Token Exchange: `https://open.tiktokapis.com/v2/oauth/token/`
- User Info: `https://open.tiktokapis.com/v2/user/info/`
- Video Metrics: `https://open.tiktokapis.com/v2/research/video/query/`

### LinkedIn API
- Authorization: `https://www.linkedin.com/oauth/v2/authorization`
- Token Exchange: `https://www.linkedin.com/oauth/v2/accessToken`
- User Info: `https://api.linkedin.com/v2/userinfo`
- Post Analytics: `https://api.linkedin.com/v2/socialActions/{urn}`

## Next Steps

After setting up OAuth:

1. Test the connection flow in your dashboard
2. Test content submission for campaigns
3. Verify metrics are being fetched correctly
4. Test the leaderboard functionality

For production deployment, make sure to:
- Use HTTPS for redirect URIs
- Store secrets securely
- Enable proper error logging
- Set up monitoring for OAuth failures
