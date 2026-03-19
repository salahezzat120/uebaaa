# Supabase Setup Instructions

## Your Supabase Project

**Project URL:** https://zljuzuryhwweaqetgwwz.supabase.co

## Required Credentials

You've provided:
- ✅ `SUPABASE_URL`: https://zljuzuryhwweaqetgwwz.supabase.co
- ✅ `SUPABASE_ANON_KEY`: sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY`: **You still need this!**

## Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Under **Project API keys**, find **service_role** key
5. **Copy it** (it starts with `eyJ...`)
6. **Never expose this key** - it has admin access!

## Complete Setup Steps

### 1. Run Database Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

This creates all necessary tables:
- `data_sources`
- `users`
- `alerts`
- `processed_rows`

### 2. Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `csv-files`
4. Make it **Public** (or configure RLS policies)
5. Click **Create bucket**

### 3. Update Backend Environment

Edit `backend-node/.env`:

```env
SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key_here
```

### 4. Test Connection

```bash
cd backend-node
npm run dev
```

Check console for: `🗄️  Supabase: Connected`

## Security Notes

- ✅ **Anon Key**: Safe for client-side use (has RLS protection)
- ⚠️ **Service Role Key**: **KEEP SECRET!** Only use on backend
- 🚫 **Never commit** `.env` files to git
- ✅ `.env` is already in `.gitignore`

## Row Level Security (RLS)

The migration sets up basic RLS policies. For production, you should:

1. Enable authentication
2. Create user-specific policies
3. Restrict service role key usage
4. Set up proper access controls

## Troubleshooting

### "Missing Supabase environment variables"
- Check all three keys are in `.env`
- Restart Node.js server after changing `.env`

### "Failed to upload file"
- Verify storage bucket `csv-files` exists
- Check bucket is public or RLS allows access
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### "Table doesn't exist"
- Run the SQL migration
- Check Supabase Dashboard → Table Editor





