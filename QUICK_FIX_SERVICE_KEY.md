# Quick Fix: Service Role Key Error

## Error You're Seeing
```
Failed to upload CSV: Supabase authentication error: Invalid Compact JWS.
Please check your SUPABASE_SERVICE_ROLE_KEY in .env file.
```

## Solution (3 Steps)

### Step 1: Get Service Role Key from Supabase

1. **Open Supabase Dashboard:**
   - Go to: https://app.supabase.com
   - Sign in and select your project

2. **Navigate to API Settings:**
   - Click **Settings** (⚙️ gear icon) in left sidebar
   - Click **API** under Configuration section

3. **Copy Service Role Key:**
   - Scroll down to **"Project API keys"** section
   - Find **`service_role`** row (NOT `anon` or `publishable`)
   - Click the **eye icon** or **"Reveal"** button
   - Copy the entire key (it's very long, starts with `eyJ...`)

### Step 2: Add to .env File

1. **Open `backend-node/.env` file** (create it if it doesn't exist)

2. **Add or update this line:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...paste_your_full_key_here
   ```

3. **Complete .env file should look like:**
   ```env
   SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_full_key
   FASTAPI_URL=http://localhost:5000
   PORT=3000
   NODE_ENV=development
   ```

### Step 3: Restart Node.js Backend

1. **Stop the backend** (press Ctrl+C in the terminal where it's running)

2. **Restart it:**
   ```powershell
   cd backend-node
   npm run dev
   ```

3. **Verify it loaded:**
   Look for this message when it starts:
   ```
   ✅ Supabase configured
      URL: https://zljuzuryhwweaqetgwwz.supabase.co
      Admin client: Available (service role key set)
   ```

   ❌ If you see "Admin client: Not available", the key is still wrong.

## Test After Fix

1. Try uploading a CSV file again
2. The "Invalid Compact JWS" error should be gone
3. File should upload successfully

## Important Notes

⚠️ **Security Warning:**
- The service role key has **full admin access** to your Supabase project
- **Never** commit it to git (`.env` is in `.gitignore`)
- **Never** share it publicly
- Only use it in backend/server code

✅ **Safe to Share:**
- Supabase URL
- Anon/Publishable key (already shared)

## Still Having Issues?

If you still get errors after adding the key:

1. **Check the key is correct:**
   - Key should be very long (hundreds of characters)
   - Starts with `eyJ...` (JWT token format)
   - No extra spaces or quotes

2. **Verify .env file location:**
   - Must be in `backend-node/` folder
   - Named exactly `.env` (not `.env.txt` or `env`)

3. **Check Node.js logs:**
   - Look for errors when backend starts
   - Should show "Admin client: Available"





