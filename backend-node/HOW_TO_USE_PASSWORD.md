# How to Use Google App Password in .env File

## Google Shows Password WITH Spaces
Google displays app passwords like this:
```
abcd efgh ijkl mnop
```
(16 characters with spaces in between)

## But .env File Needs NO Spaces
When you put it in `.env`, you MUST remove ALL spaces!

### Example:
**What Google shows:**
```
huxw krhy kkzr dlfk
```

**What to put in .env:**
```
SMTP_PASSWORD=huxwkrhyskkzrdlfk
```
(No spaces!)

## Step-by-Step:

1. **Copy the password from Google** (with spaces)
   - Example: `abcd efgh ijkl mnop`

2. **Remove all spaces manually:**
   - `abcdefghijklmnop`
   
   OR use Find & Replace:
   - Find: ` ` (space)
   - Replace: `` (nothing)
   - Replace All

3. **Put in .env file:**
   ```
   SMTP_PASSWORD=abcdefghijklmnop
   ```

## Quick Test:
After updating, check that password has no spaces:
```bash
node check-env-password.js
```

It should show: "Has spaces: NO ✅"

---

**Important:** The password MUST be exactly 16 characters when you remove spaces!

