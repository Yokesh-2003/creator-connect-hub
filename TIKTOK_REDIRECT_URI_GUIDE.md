# Where to Add TikTok Redirect URI - Step by Step

## Location: Login Kit Settings (Not Basic Information)

The redirect URI is configured in the **Login Kit** product settings, not in Basic Information.

### Step-by-Step Instructions:

1. **Go to TikTok Developer Portal**
   - Visit: https://developers.tiktok.com/
   - Sign in to your account

2. **Navigate to Your App**
   - Click on **"GameOfCreators Dev"** (or your app name)
   - Make sure you're in **Sandbox** mode (or Production if approved)

3. **Go to Login Kit Settings**
   - In the left sidebar, look for **"Products"** section
   - Click on **"Login Kit"** (or find it under Products)
   - If Login Kit is not enabled, you need to:
     - Go to **"Products"** tab
     - Enable **"Login Kit"** product
     - Make sure it's configured for **"Web"** platform

4. **Find Redirect URI Settings**
   - Once in Login Kit settings, look for:
     - **"Redirect URIs"** field
     - **"Authorized Redirect URLs"** section
     - **"OAuth Settings"** → **"Redirect URIs"**
     - **"Web Configuration"** → **"Redirect URIs"**

5. **Add Your Redirect URI**
   - In the Redirect URI field, add:
     ```
     https://creator-connect-hub-gamma.vercel.app/auth/tiktok/callback
     ```
   - Click **"Add"** or **"Save"**

6. **Apply Changes**
   - Click the red **"Apply changes"** button at the top right
   - Wait for confirmation

## Alternative Locations to Check:

If you don't see "Login Kit" in the sidebar, try:

### Option 1: Products Tab
1. Click **"Products"** in the left sidebar
2. Find **"Login Kit"** in the products list
3. Click on it to open settings
4. Look for **"Redirect URIs"** or **"Web Configuration"**

### Option 2: Credentials Section
1. Click **"Credentials"** in the left sidebar
2. Look for **"OAuth 2.0"** or **"Redirect URIs"** section

### Option 3: Security/URL Properties
1. You mentioned you verified URL Properties - that's good!
2. After domain verification, go back to **"Login Kit"** → **"Settings"**
3. The Redirect URI field should now be available

## Important Notes:

- **Domain Verification First**: If you haven't verified your domain in URL Properties, do that first
- **Web Platform Required**: Login Kit must be enabled for "Web" platform (not just Desktop/Mobile)
- **Exact Match**: The URI must match exactly (no trailing slash, correct case)

## If You Still Can't Find It:

1. **Check if Login Kit is enabled:**
   - Go to **"Products"** tab
   - Look for **"Login Kit"** - it should show as "Enabled" or "Active"
   - If not enabled, click to enable it

2. **Check Platform Configuration:**
   - In Login Kit settings, ensure **"Web"** is selected as a platform
   - Redirect URIs are only available for Web platform

3. **Try Production Mode:**
   - If you're in Sandbox, try switching to Production (if available)
   - Some settings might only appear in Production mode

4. **Contact TikTok Support:**
   - If you still can't find it, TikTok support can guide you
   - They may need to enable certain permissions for your developer account

## Visual Guide:

The redirect URI field typically looks like:
```
┌─────────────────────────────────────────────┐
│ Redirect URIs                                │
├─────────────────────────────────────────────┤
│ [https://creator-connect-hub-gamma...] [Add]│
│                                              │
│ • https://creator-connect-hub-gamma...       │
└─────────────────────────────────────────────┘
```

Or it might be a textarea where you paste multiple URIs (one per line).
