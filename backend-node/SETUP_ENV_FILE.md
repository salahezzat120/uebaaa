# Complete .env File Setup

## Your Complete .env File

Copy this entire content into `backend-node/.env`:

```env
# ============================================
# Guardian Owl UEBA - Complete .env Configuration
# ============================================

# Database Configuration (Supabase)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# Gmail SMTP Configuration (Email Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=dincvxngaqrlhzgm

# SOC Team Email Addresses (comma-separated)
SOC_EMAILS=salahezzat120@gmail.com

# API Configuration (Optional)
API_BASE_URL=http://localhost:3000
```

## What to Replace

1. **Supabase Settings** (if you already have these, keep them):
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

2. **Email Settings** (Already configured for you):
   - ✅ `SMTP_USER=salahezzat120@gmail.com` - Already set
   - ✅ `SMTP_PASSWORD=dincvxngaqrlhzgm` - Already set (no spaces!)
   - ✅ `SOC_EMAILS=salahezzat120@gmail.com` - Already set

## Quick Setup Steps

1. **Open** `backend-node/.env` file
2. **Copy** the entire configuration above
3. **Replace** Supabase values if needed (or keep existing ones)
4. **Save** the file
5. **Test** with: `node test-email.js`

## Verification

After saving, verify your email config is correct:
```bash
cd backend-node
node test-email.js
```

You should see:
- ✅ Test email sent successfully!
- ✅ Sample alert email sent successfully!

---

**All email settings are already configured with your Gmail account!** 🚀

