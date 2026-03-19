# Gmail Free Email Setup - Quick Guide

## Step 1: Enable Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Click on Security** (left sidebar)
3. **Enable 2-Step Verification** (if not already enabled):
   - Scroll to "2-Step Verification"
   - Click "Get started" and follow the steps
   - You'll need your phone for verification
4. **Generate App Password**:
   - After 2-Step Verification is enabled, go back to Security
   - Scroll down to "2-Step Verification" section
   - Click on "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Type: "Guardian Owl UEBA"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **Save this password now** - you won't see it again!

## Step 2: Update .env File

Open `backend-node/.env` and add/update these lines:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=your-16-char-app-password-here

# SOC Team Email (your email for testing)
SOC_EMAILS=salahezzat120@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Important**: 
- Replace `your-16-char-app-password-here` with the 16-character app password you generated
- Remove spaces from the app password (e.g., `abcdefghijklmnop`)

## Step 3: Install nodemailer

```bash
cd backend-node
npm install nodemailer
```

## Step 4: Test Email Configuration

### Option 1: Test via API (Backend must be running)

1. **Start your backend server**:
   ```bash
   cd backend-node
   npm run dev
   ```

2. **In another terminal, test the email**:
   ```bash
   curl -X POST http://localhost:3000/api/email/test \
     -H "Content-Type: application/json" \
     -d "{\"email\": \"salahezzat120@gmail.com\"}"
   ```

### Option 2: Test with Test Script

Use the test script I created (see next section)

## Step 5: Verify

Check your email inbox (salahezzat120@gmail.com) - you should receive a test email!

---

## Common Issues

### "Invalid login" or "Authentication failed"
- Make sure you're using the **App Password**, not your Gmail password
- Verify 2-Step Verification is enabled
- Remove spaces from the app password

### "Less secure app access"
- Gmail doesn't support "less secure apps" anymore
- You MUST use App Passwords (as described above)

### Email not received
- Check spam/junk folder
- Wait a few minutes (Gmail may delay)
- Check backend logs for errors

---

**Ready to test!** Once configured, alerts will automatically send emails to salahezzat120@gmail.com 🚀

