# SendGrid Setup - EASIEST Free Email Service

## Why SendGrid?
✅ **100 emails/day FREE forever**  
✅ **No app passwords needed** - just an API key  
✅ **Very easy to set up**  
✅ **Professional and reliable**

## Step-by-Step Setup

### Step 1: Sign Up (2 minutes)
1. Go to: https://signup.sendgrid.com/
2. Fill in your details
3. Verify your email
4. Complete setup

### Step 2: Create API Key (1 minute)
1. Log in to SendGrid dashboard
2. Go to: **Settings** → **API Keys**
3. Click: **Create API Key**
4. Name it: `Guardian Owl UEBA`
5. Choose: **Full Access** (or "Mail Send" permissions)
6. Click: **Create & View**
7. **COPY THE API KEY NOW** (you won't see it again!)

### Step 3: Verify Sender (1 minute)
1. Go to: **Settings** → **Sender Authentication**
2. Click: **Verify a Single Sender**
3. Fill in your email address (e.g., sklans120@gmail.com)
4. Verify the email they send you

### Step 4: Update .env File
Open `backend-node/.env` and replace email settings with:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key-here
SOC_EMAILS=sklans120@gmail.com
```

**Important**: 
- `SMTP_USER` is always `apikey` (literal word)
- `SMTP_PASSWORD` is your SendGrid API key (starts with `SG.`)

### Step 5: Test
```bash
cd backend-node
node test-email.js
```

## That's It! 🎉

No app passwords, no complex setup - just copy the API key and you're done!

---

## Free Tier Limits
- ✅ 100 emails per day
- ✅ FREE forever
- ✅ Perfect for alert notifications

