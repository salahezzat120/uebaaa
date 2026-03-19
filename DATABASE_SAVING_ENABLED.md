# ✅ Database Saving Enabled

## What Changed

I've added automatic saving of processed CSV rows to the database. Now when you process a CSV file:

1. ✅ **Each processed row is saved** to `processed_rows` table
2. ✅ **Anomaly scores are stored** for historical analysis
3. ✅ **Data persists** even after page refresh
4. ✅ **Can create alerts** from saved anomalies
5. ✅ **Historical reporting** available

## How It Works

### Data Flow:
```
CSV Upload → Data Source Created → Processing Starts
                                         ↓
                              Real-Time Processing
                                         ↓
                              Each Row Processed
                                         ↓
                              Processing Complete
                                         ↓
                              Save All Rows to Database ✅
```

### What Gets Saved:
- ✅ Row number
- ✅ User ID
- ✅ Timestamp
- ✅ Action type
- ✅ Source IP
- ✅ Resource
- ✅ Status
- ✅ **Anomaly Score** (0-100)
- ✅ **Is Anomaly** (true/false)
- ✅ Features used for inference
- ✅ Processing timestamp

## New API Endpoints

### Save Processed Rows:
```
POST /api/data-sources/:id/processed-rows
Body: { rows: [...] }
```

### Get Processed Rows:
```
GET /api/data-sources/:id/processed-rows?limit=1000&offset=0&anomaly_only=true
```

## Benefits

1. **Historical Analysis**: Review past anomalies
2. **Audit Trail**: Who processed what, when
3. **Alert Creation**: Automatically create alerts from anomalies
4. **Reporting**: Generate reports from saved data
5. **Data Persistence**: Results survive browser refresh
6. **User Risk Scoring**: Update user risk scores based on anomalies

## When Data is Saved

- ✅ **After processing completes** - All rows saved in one batch
- ✅ **Linked to data source** - Each row linked to the CSV file
- ✅ **Automatic** - No manual action needed

## Viewing Saved Data

You can query saved processed rows:
- All rows for a data source
- Only anomalies (filter by `is_anomaly = true`)
- By date range
- By user ID
- By anomaly score threshold

## Example: Query Anomalies

```sql
SELECT * FROM processed_rows 
WHERE data_source_id = 'your-source-id' 
  AND is_anomaly = true 
ORDER BY anomaly_score DESC;
```

## Current Status

- ✅ **Database schema**: `processed_rows` table exists
- ✅ **API endpoint**: Added to save processed rows
- ✅ **Frontend integration**: Auto-saves after processing
- ✅ **Error handling**: Graceful fallback if save fails

**Your processed CSV data is now automatically saved to the database!** 🎉





