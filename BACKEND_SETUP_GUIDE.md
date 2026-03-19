# Complete Backend Setup Guide

This guide explains how to set up the hybrid backend architecture for Guardian Owl.

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node.js Backend │  ← Main API Gateway (Port 3000)
│   (Express.js)  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼        ▼
┌────────┐ ┌──────────┐
│Supabase│ │ FastAPI  │
│Database│ │ AI/ML    │
│Storage │ │ (Port    │
│        │ │  5000)   │
└────────┘ └──────────┘
```

## Step 1: Set Up Supabase

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and API keys

2. **Run Database Migrations:**
   - Go to SQL Editor in Supabase dashboard
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`
   - This creates all necessary tables

3. **Create Storage Bucket:**
   - Go to Storage in Supabase dashboard
   - Create a new bucket named `csv-files`
   - Set it to public (or configure RLS policies)

4. **Get Your Credentials:**
   - Project URL: Found in Settings → API
   - Anon Key: Found in Settings → API
   - Service Role Key: Found in Settings → API (keep secret!)

## Step 2: Set Up Node.js Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend-node
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file:**
   ```env
   PORT=3000
   NODE_ENV=development
   
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   FASTAPI_URL=http://localhost:5000
   FASTAPI_API_KEY=optional_api_key
   
   FRONTEND_URL=http://localhost:8080
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   🚀 Node.js Backend running on http://localhost:3000
   📡 Frontend URL: http://localhost:8080
   🤖 FastAPI URL: http://localhost:5000
   🗄️  Supabase: Connected
   ```

## Step 3: Set Up FastAPI (AI Service)

1. **Navigate to FastAPI directory:**
   ```bash
   cd backend-fastapi
   # or if using existing backend folder:
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment (if needed):**
   - Update model paths in your FastAPI code
   - Ensure model file exists at specified path

4. **Start FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 5000
   ```

   Or if using the existing structure:
   ```bash
   cd backend
   uvicorn main:app --reload --port 5000
   ```

## Step 4: Update Frontend

1. **Update API configuration:**
   
   Edit `src/services/dataSourcesApi.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
   ```

2. **Create `.env` file in root:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. **Update API calls:**
   - All API calls should go to Node.js backend (port 3000)
   - Node.js will proxy AI requests to FastAPI (port 5000)

## Step 5: Test the Setup

1. **Test Node.js Backend:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test FastAPI:**
   ```bash
   curl http://localhost:5000/health
   ```

3. **Test Integration:**
   ```bash
   curl http://localhost:3000/api/ai/health
   ```

## API Flow Examples

### Upload CSV File:
```
Frontend → POST /api/data-sources/upload-csv (Node.js)
    ↓
Node.js → Uploads file to Supabase Storage
    ↓
Node.js → Creates record in Supabase Database
    ↓
Node.js → Returns data source info to Frontend
```

### Process Row with AI:
```
Frontend → POST /api/ai/predict (Node.js)
    ↓
Node.js → POST /api/inference/predict (FastAPI)
    ↓
FastAPI → Runs model inference
    ↓
FastAPI → Returns prediction
    ↓
Node.js → Returns to Frontend
```

## Troubleshooting

### Node.js can't connect to Supabase:
- Check SUPABASE_URL and keys in `.env`
- Verify Supabase project is active
- Check network/firewall settings

### FastAPI not responding:
- Ensure FastAPI is running on port 5000
- Check FASTAPI_URL in Node.js `.env`
- Verify model file exists

### CORS errors:
- Update FRONTEND_URL in Node.js `.env`
- Check CORS settings in both backends

## Production Deployment

1. **Environment Variables:**
   - Use secure environment variable management
   - Never commit `.env` files
   - Use different Supabase projects for dev/prod

2. **Security:**
   - Enable RLS policies in Supabase
   - Use API keys for FastAPI
   - Implement authentication/authorization

3. **Scaling:**
   - Use process managers (PM2) for Node.js
   - Use Gunicorn for FastAPI
   - Consider containerization (Docker)

## Next Steps

- [ ] Set up authentication
- [ ] Configure RLS policies in Supabase
- [ ] Add error logging/monitoring
- [ ] Set up CI/CD pipeline
- [ ] Add API rate limiting
- [ ] Implement caching





