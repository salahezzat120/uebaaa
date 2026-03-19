# Fix Both Issues

## Issues Found

1. ❌ **FastAPI Connection**: Node.js trying IPv6 `::1:5000` instead of IPv4 `127.0.0.1:5000`
2. ❌ **Supabase Key**: Service role key format wrong - getting "Invalid Compact JWS" error

## What I Fixed

### 1. FastAPI Connection ✅
- Changed `localhost` to `127.0.0.1` to force IPv4
- This fixes: `connect ECONNREFUSED ::1:5000`

### 2. Supabase Key Validation ✅
- Added validation to check key format
- Service role key MUST be a JWT token starting with `eyJ`
- Added better error messages

## Action Required: Get Correct Service Role Key

The error "Invalid Compact JWS" means you're using the **wrong key format**.

### ❌ Wrong Key Type:
You might be using:
- `sb_publishable_...` (publishable key)
- `anon` key
- Wrong format

### ✅ Correct Key Type:
You need the **`service_role`** key which:
- Starts with `eyJ` (JWT token format)
- Is VERY long (hundreds of characters)
- Only visible in Supabase Dashboard → Settings → API

### Steps to Get Correct Key:

1. **Go to Supabase Dashboard:**
   ```
   https://app.supabase.com
   ```

2. **Select Your Project:**
   - The one with URL: `zljuzuryhwweaqetgwwz.supabase.co`

3. **Navigate to API Settings:**
   - Click **Settings** (gear icon ⚙️)
   - Click **API** in left menu

4. **Find Service Role Key:**
   - Scroll to **"Project API keys"** section
   - Look for row labeled **`service_role`** 
   - ⚠️ NOT `anon` or `publishable` - those are different!
   
5. **Copy the FULL Key:**
   - Click **eye icon** 👁️ or **"Reveal"** button
   - Copy the ENTIRE key (it's very long, starts with `eyJ...`)
   - Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsanV6dXJ5aHd3ZWFxZXRnd3d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY...` (much longer!)

6. **Update .env File:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...paste_full_key_here
   ```

## After Fixing

1. **Restart Node.js Backend:**
   ```powershell
   # Stop (Ctrl+C)
   cd backend-node
   npm run dev
   ```

2. **Verify:**
   - Should see: `Admin client: Available (service role key set)`
   - Should NOT see: `Service role key format appears invalid`

3. **Test:**
   - Upload CSV - should work!
   - FastAPI connection should work!

## Quick Check

After restart, the logs should show:
```
✅ Supabase configured
   URL: https://zljuzuryhwweaqetgwwz.supabase.co
   Admin client: Available (service role key set)  ✅ GOOD
```

If you see:
```
⚠️  Admin client: Service role key format appears invalid  ❌ BAD
   Current key starts with: sb_publi...
```

This means you're using the wrong key. Get the `service_role` key instead!





