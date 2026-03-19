# Email Configuration Fix Options

## Current Configuration
```
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=huxwkrhyskkzrdlfk
SOC_EMAILS=sklans120@gmail.com
```

## The Issue
The app password `huxwkrhyskkzrdlfk` must match the `SMTP_USER` email account.

## Solution Options

### Option 1: Use salahezzat120@gmail.com for Everything
If the app password was generated for `salahezzat120@gmail.com`:

Update `.env`:
```env
SMTP_USER=salahezzat120@gmail.com
SMTP_PASSWORD=huxwkrhyskkzrdlfk
SOC_EMAILS=salahezzat120@gmail.com
```

### Option 2: Generate New App Password for salahezzat120@gmail.com
If the current password doesn't work for salahezzat120@gmail.com:

1. Go to: https://myaccount.google.com/apppasswords
2. Log in as: salahezzat120@gmail.com
3. Generate new app password
4. Update `.env` with new password

### Option 3: Use sklans120@gmail.com as Sender
If you want to send from sklans120@gmail.com:

1. Generate app password for sklans120@gmail.com
2. Update `.env`:
```env
SMTP_USER=sklans120@gmail.com
SMTP_PASSWORD=<new-password-for-sklans>
SOC_EMAILS=sklans120@gmail.com
```

## Which Email Should You Use?

**Recommendation:** Use the same email for both SMTP_USER and SOC_EMAILS for simplicity.

- If you want alerts sent to `sklans120@gmail.com`, use that as SMTP_USER too
- If you prefer `salahezzat120@gmail.com`, use that for both

The key is: **App password must match SMTP_USER account!**

