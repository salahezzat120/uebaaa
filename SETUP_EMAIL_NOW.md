# 🚀 Quick Setup: Email Alerts to Your Gmail

## ⚡ Fast Setup (5 Minutes)

### Step 1: Get Gmail App Password (2 minutes)

1. **Go to**: https://myaccount.google.com/apppasswords
   - (If asked to sign in, use: salahezzat120@gmail.com)

2. **Generate App Password**:
   - Select "Mail"
   - Select "Other (Custom name)"
   - Type: `Guardian Owl`
   - Click "Generate"

3. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **Remove all spaces!** It should be: `abcdefghijklmnop`

### Step 2: Update .env File (1 minute)

Open `backend-node/.env` and add these lines:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SOC_EMAILS=salahezzat120@gmail.com
FRONTEND_URL=http://localhost:5173
```

**Replace `abcdefghijklmnop` with your actual app password!**

### Step 3: Install nodemailer (30 seconds)

```bash
cd backend-node
npm install nodemailer
```

### Step 4: Test It! (1 minute)

```bash
cd backend-node
node test-email.js
```

You should see:
```
✅ Test email sent successfully!
✅ Sample alert email sent successfully!
```

**Check your email: salahezzat120@gmail.com** 📬

---

## 🔍 Troubleshooting

### ❌ "Email service is NOT configured"
- Make sure `.env` file exists in `backend-node/` folder
- Check that all SMTP variables are set
- No typos in variable names

### ❌ "Invalid login" or "Authentication failed"
- You MUST use App Password, not your Gmail password
- Remove spaces from app password
- Make sure 2-Step Verification is enabled

### ❌ Can't find App Passwords option
- Go to: https://myaccount.google.com/security
- Enable "2-Step Verification" first
- Then App Passwords will appear

### ✅ Email sent but not received
- Check spam/junk folder
- Wait 1-2 minutes
- Check backend terminal for errors

---

## 🎉 Done!

Once test works, alerts will automatically send emails to your Gmail when:
- High severity alerts are created
- Critical severity alerts are created

**No need to restart - just test and it works!** 🚀

