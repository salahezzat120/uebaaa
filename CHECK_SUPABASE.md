# Quick Supabase Check

## Your Current Setup

✅ **Supabase URL**: https://zljuzuryhwweaqetgwwz.supabase.co
✅ **Anon Key**: sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3
⚠️ **Service Role Key**: Still needed

## Quick Verification

### 1. Check Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/settings/api
2. Look for **service_role** key (secret)
3. It should start with `eyJ...`
4. Copy it and add to `backend-node/.env`

### 2. Test Database Connection

Run this in your Supabase SQL Editor:

```sql
SELECT * FROM data_sources LIMIT 1;
```

If you get an error saying table doesn't exist, run the migration:
- File: `supabase/migrations/001_initial_schema.sql`

### 3. Test Storage

Go to: https://supabase.com/dashboard/project/zljuzuryhwweaqetgwwz/storage/buckets

Check if `csv-files` bucket exists. If not, create it.

### 4. Test Node.js Connection

```bash
cd backend-node
npm run dev
```

You should see:
```
✅ Supabase configured
   URL: https://zljuzuryhwweaqetgwwz.supabase.co
   Admin client: Available (or Not available)
🚀 Node.js Backend running on http://localhost:3000
```

## Next Steps After Getting Service Role Key

1. Add to `backend-node/.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your_key_here
   ```

2. Restart Node.js server

3. Test file upload in your app

## Security Reminder

🔒 **Never share your service role key!**
- It has full admin access
- Keep it only in `.env` file (already in .gitignore)
- Never commit it to git





