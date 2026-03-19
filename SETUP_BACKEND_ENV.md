# Setup Backend Environment Variables

## Quick Setup

I've created `.env.example` in `backend-node/`. Now create your `.env` file:

### Step 1: Create `.env` File

Create a file named `.env` in the `backend-node/` directory with this content:

```env
# Supabase Configuration
SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3

# Service Role Key (REQUIRED for CSV uploads!)
# Get from: Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# FastAPI Configuration
FASTAPI_URL=http://localhost:5000

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Step 2: Get Your Service Role Key

1. Go to: https://app.supabase.com
2. Sign in and select your project
3. Settings → API
4. Scroll to **Project API keys**
5. Find **`service_role`** key (NOT `anon` or `publishable`)
6. Click **Reveal** and copy it
7. Replace `your_service_role_key_here` in `.env`

### Step 3: Restart Node.js Backend

```powershell
# Stop current backend (Ctrl+C if running)
cd backend-node
npm run dev
```

### Step 4: Verify

When backend starts, you should see:
```
✅ Supabase configured
   URL: https://zljuzuryhwweaqetgwwz.supabase.co
   Admin client: Available (service role key set)
```

If you see "Admin client: Not available", the service role key is missing.

## What This Fixes

✅ **CSV Upload** - "Invalid Compact JWS" error will be gone
✅ **File Storage** - Files can be uploaded to Supabase Storage
✅ **Admin Operations** - Can perform privileged database operations

## Current Credentials You Have

- ✅ **Supabase URL:** `https://zljuzuryhwweaqetgwwz.supabase.co`
- ✅ **Anon/Publishable Key:** `sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3`
- ❌ **Service Role Key:** Need to get from Supabase Dashboard

## Important Notes

⚠️ **Security:** 
- The service role key has admin privileges
- Never commit `.env` to git (it's already in `.gitignore`)
- Only share the anon/publishable key publicly





