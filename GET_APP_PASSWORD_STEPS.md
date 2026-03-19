# How to Get Gmail App Password - Step by Step

## ✅ Good News!
Your account already has **2-Step Verification activated** (since 2021), so you can create an App Password right away!

## 📱 Steps to Get App Password

### Step 1: Go to App Passwords Page

**Option A: Direct Link**
- Click this link: https://myaccount.google.com/apppasswords
- (Make sure you're signed in as: salahezzat120@gmail.com)

**Option B: From Your Current Page**
- Scroll down to find "**App passwords**" section
- Or click on "**2-Step Verification**" → then look for "**App passwords**" link
- Or search for "app passwords" in the search box at the top

### Step 2: Generate App Password

1. **Select app**: Choose "**Mail**"
2. **Select device**: Choose "**Other (Custom name)**"
3. **Type name**: Enter `Guardian Owl UEBA` (or any name you like)
4. **Click "Generate"**

### Step 3: Copy the Password

You'll see a **16-character password** that looks like:
```
abcd efgh ijkl mnop
```

**⚠️ IMPORTANT:**
- Copy this password NOW (you won't see it again!)
- **Remove all spaces** when using it
- Example: `abcdefghijklmnop` (no spaces)

### Step 4: Use in .env File

Open `backend-node/.env` and add:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SOC_EMAILS=salahezzat120@gmail.com
FRONTEND_URL=http://localhost:5173
```

**Replace `abcdefghijklmnop` with your actual app password (no spaces!)**

### Step 5: Test It!

```bash
cd backend-node
node test-email.js
```

---

## 🔍 Can't Find App Passwords?

If you don't see "App passwords" option:

1. Make sure you're on this page: https://myaccount.google.com/apppasswords
2. Or try: https://myaccount.google.com/security → Scroll to "2-Step Verification" → Click it → Look for "App passwords"
3. If still not visible, try refreshing the page

---

## ✅ That's It!

Once you have the app password and added it to `.env`, you're all set! The system will automatically send email alerts to salahezzat120@gmail.com when security alerts are detected. 🚀

