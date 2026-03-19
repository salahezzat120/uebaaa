# Generate New App Password - STEP BY STEP

## The Problem
The current app password `huxwkrhyskkzrdlfk` is NOT working with `salahezzat120@gmail.com`.

## Solution: Generate a NEW App Password

### Step 1: Go to App Passwords
Open: https://myaccount.google.com/apppasswords

### Step 2: Sign In
Make sure you're signed in to: **salahezzat120@gmail.com**

### Step 3: Delete Old Password (Optional)
- Find the "grad" app password
- Click the delete/trash icon to remove it

### Step 4: Generate New Password
1. In the "اسم التطبيق" (App name) field, type: **Guardian Owl UEBA**
2. Click **"إنشاء"** (Create/Generate)
3. You'll see a popup with a 16-character password like: `xxxx xxxx xxxx xxxx`

### Step 5: Copy the Password
- Copy the password from the popup
- **Remove all spaces!**
- Example: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### Step 6: Update .env File
Open `backend-node/.env` and find:
```
SMTP_PASSWORD=huxwkrhyskkzrdlfk
```

Replace with (use your NEW password):
```
SMTP_PASSWORD=your-new-password-here-no-spaces
```

### Step 7: Test
```bash
node test-email.js
```

---

## Important Notes

✅ The app password MUST be generated for the SAME email as SMTP_USER  
✅ SMTP_USER is currently: `salahezzat120@gmail.com`  
✅ So generate the password while logged into `salahezzat120@gmail.com`  
✅ Remove ALL spaces from the password  
✅ The password is 16 characters when you remove spaces  

---

## Current Configuration
```
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=<needs-new-password>
SOC_EMAILS=salahezzat120@gmail.com
```

Generate the NEW password and update SMTP_PASSWORD in .env! 🚀

