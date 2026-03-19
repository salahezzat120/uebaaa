# Create Supabase Storage Bucket

## Bucket Name Required

**Bucket Name:** `csv-files`

## How to Create the Bucket

### Step 1: Go to Supabase Dashboard

1. Visit: https://app.supabase.com
2. Sign in and select your project
3. Click **Storage** in the left sidebar

### Step 2: Create New Bucket

1. Click **"New bucket"** button (top right)
2. **Bucket name:** `csv-files` (exactly this name, lowercase with hyphen)
3. **Public bucket:** 
   - ✅ **Check this** if you want public access to uploaded files
   - ❌ **Uncheck** if you want private access (recommended for security)
4. **File size limit:** Leave default or set your preferred limit
5. **Allowed MIME types:** Leave empty (allows all) or add `text/csv`
6. Click **"Create bucket"**

### Step 3: Set Up Permissions (If Private)

If you created a **private bucket**, you need to set up policies:

1. Click on the `csv-files` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Add this policy:

```sql
-- Allow service role to upload files
CREATE POLICY "Service role can upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'csv-files');

-- Allow service role to read files
CREATE POLICY "Service role can read"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'csv-files');
```

Or use the **"Quick start"** option and select:
- **Policy name:** "Allow service role access"
- **Allowed operations:** SELECT, INSERT, UPDATE, DELETE
- **Target roles:** service_role

### Step 4: Verify

After creating the bucket, try uploading a CSV file again. The error should be gone!

## Current Code Uses

The backend code expects a bucket named exactly:
```
csv-files
```

This is hardcoded in `backend-node/src/routes/dataSources.js`:
```javascript
.from('csv-files')
```

## Alternative: Skip File Storage

If you don't want to use Supabase Storage, you can modify the code to:
- Store files locally
- Skip file storage entirely (just save metadata)
- Use a different storage service

But for now, **creating the `csv-files` bucket is the easiest solution!**





