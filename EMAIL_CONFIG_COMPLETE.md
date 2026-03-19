# ✅ Email Configuration - Ready to Test!

## Your Configuration

- **App Name**: Guardian Owl UEBA
- **App Password**: `dinc vxng aqrl hzgm` → **Remove spaces**: `dincvxngaqrlhzgm`
- **Email**: salahezzat120@gmail.com

## Update .env File

Open `backend-node/.env` and make sure these lines are present:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=dincvxngaqrlhzgm
SOC_EMAILS=salahezzat120@gmail.com
FRONTEND_URL=http://localhost:5173
```

**⚠️ Important**: Make sure `SMTP_PASSWORD` has NO SPACES!
- ✅ Correct: `dincvxngaqrlhzgm`
- ❌ Wrong: `dinc vxng aqrl hzgm`

## Test Email Configuration

After updating `.env`, run:

```bash
cd backend-node
node test-email.js
```

You should see:
```
✅ Test email sent successfully!
✅ Sample alert email sent successfully!
```

## Check Your Email

Check **salahezzat120@gmail.com** inbox (and spam folder) for:
1. Test email
2. Sample alert email

## Once Test Works

✅ **Done!** Alerts will now automatically send emails to salahezzat120@gmail.com when:
- High severity alerts are created
- Critical severity alerts are created

---

**Need help?** Check the terminal output for any error messages!

