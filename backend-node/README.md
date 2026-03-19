# Node.js Backend for Guardian Owl

This is the main Node.js backend that handles general API requests, integrates with Supabase for database/storage, and proxies AI requests to FastAPI.

## Architecture

```
Frontend (React)
    ↓
Node.js Backend (Express) ← Main API Gateway
    ├──→ Supabase (Database & Storage)
    └──→ FastAPI (AI/ML Services)
```

## Setup

1. **Install dependencies:**
   ```bash
   cd backend-node
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   - Supabase URL and keys
   - FastAPI URL
   - Frontend URL

3. **Set up Supabase:**
   - Create a Supabase project
   - Run the SQL migrations in `supabase/migrations/`
   - Create storage bucket named `csv-files`

4. **Start the server:**
   ```bash
   npm run dev  # Development with auto-reload
   # or
   npm start    # Production
   ```

## API Endpoints

### Data Sources
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources` - Create data source
- `GET /api/data-sources/:id` - Get data source
- `PATCH /api/data-sources/:id` - Update data source
- `DELETE /api/data-sources/:id` - Delete data source
- `POST /api/data-sources/:id/connect` - Connect data source
- `POST /api/data-sources/:id/disconnect` - Disconnect data source
- `POST /api/data-sources/:id/sync` - Sync data source
- `POST /api/data-sources/upload-csv` - Upload CSV file

### AI Services
- `GET /api/ai/health` - Check FastAPI health
- `POST /api/ai/predict` - Run model inference

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Environment Variables

See `.env.example` for all required variables.

## Supabase Setup

1. Create tables using the SQL in `supabase/migrations/`
2. Create storage bucket: `csv-files`
3. Set up Row Level Security (RLS) policies as needed





