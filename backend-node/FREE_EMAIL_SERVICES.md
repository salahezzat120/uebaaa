# Free Email Services for Alert Notifications

## Recommended: SendGrid (Best for Production)

### ✅ Pros:
- **100 emails/day FREE forever**
- Easy API key setup (no app passwords!)
- Very reliable
- Professional service

### Setup Steps:

1. **Sign up**: https://signup.sendgrid.com/
2. **Get API Key**:
   - Dashboard → Settings → API Keys
   - Create API Key → "Full Access" or "Mail Send"
   - Copy the API key

3. **Update .env**:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key-here
SOC_EMAILS=your-email@example.com
```

---

## Option 2: Mailtrap (Best for Testing)

### ✅ Pros:
- **FREE forever for testing**
- No real emails sent (good for development)
- Very easy setup
- No spam to your inbox

### Setup Steps:

1. **Sign up**: https://mailtrap.io/
2. **Get SMTP credentials**:
   - Inbox → SMTP Settings
   - Copy username and password

3. **Update .env**:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SOC_EMAILS=your-email@example.com
```

---

## Option 3: SMTP2GO (Simple & Free)

### ✅ Pros:
- **1,000 emails/month FREE**
- Simple SMTP setup
- Easy to use

### Setup Steps:

1. **Sign up**: https://www.smtp2go.com/
2. **Get SMTP credentials**:
   - Dashboard → SMTP Users
   - Create user → Get username/password

3. **Update .env**:
```env
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp2go-username
SMTP_PASSWORD=your-smtp2go-password
SOC_EMAILS=your-email@example.com
```

---

## Recommendation

**For Production/Real Alerts**: Use **SendGrid** (100 emails/day free)
**For Testing/Development**: Use **Mailtrap** (all emails go to testing inbox)

---

## Quick Setup Guide

1. Choose a service (SendGrid recommended)
2. Sign up and get credentials
3. Update `.env` file with the credentials above
4. Run: `node test-email.js`

No app passwords needed! Just API keys or simple username/password! 🚀

