# Get Supabase Service Role Key

## Current Status

✅ **Supabase URL and Anon Key configured:**
- URL: `https://zljuzuryhwweaqetgwwz.supabase.co`
- Anon Key: `sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3`

❌ **Service Role Key Missing** - This is needed for CSV file uploads!

## How to Get Service Role Key

1. **Go to Supabase Dashboard:**
   - Visit: https://app.supabase.com
   - Sign in to your account
   - Select your project (the one with URL ending in `zljuzuryhwweaqetgwwz`)

2. **Navigate to API Settings:**
   - Click **Settings** (gear icon) in left sidebar
   - Click **API** under Configuration

3. **Copy Service Role Key:**
   - Scroll down to **Project API keys**
   - Find **`service_role`** key (NOT the `anon` or `publishable` key)
   - Click **Reveal** and copy the key
   - ⚠️ **WARNING:** This key has admin privileges - keep it secret!

4. **Add to Backend .env File:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Why Service Role Key is Needed

The **service role key** is required for:
- ✅ Uploading CSV files to Supabase Storage
- ✅ Admin operations (bypassing Row Level Security)
- ✅ Direct database writes

The **anon key** (publishable key) you provided is for:
- ✅ Public read operations
- ✅ Frontend client access
- ❌ NOT for file uploads or admin operations

## After Adding Service Role Key

1. **Restart Node.js backend:**
   ```powershell
   cd backend-node
   npm run dev
   ```

2. **Verify it's loaded:**
   - You should see: `Admin client: Available (service role key set)`
   - NOT: `Admin client: Not available`

3. **Test CSV upload:**
   - Try uploading a CSV file
   - Should work without "Invalid Compact JWS" error

## Security Note

⚠️ **Never commit the service role key to git!**

The `.env` file is already in `.gitignore`, but double-check that:
- `.env` is in `.gitignore`
- Service role key is NOT in any committed files
- Only share the anon/publishable key publicly





