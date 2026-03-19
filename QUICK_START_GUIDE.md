# Quick Start Guide - Run Your Project

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

**Frontend:**
```bash
npm install
```

**Node.js Backend:**
```bash
cd backend-node
npm install
cd ..
```

**Python (FastAPI):**
```bash
pip install -r backend-fastapi/requirements.txt
```

### Step 2: Create Environment File

Create `backend-node/.env`:
```env
SUPABASE_URL=https://zljuzuryhwweaqetgwwz.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iMovUttXIPzOkTkZoX27aw_wYK3fUl3
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3000
FASTAPI_URL=http://localhost:5000
```

### Step 3: Start All Services

**Open 3 terminal windows:**

**Terminal 1 - FastAPI:**
```bash
cd backend-fastapi
python main.py
```

**Terminal 2 - Node.js:**
```bash
cd backend-node
npm run dev
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### Step 4: Open Browser

Go to: **http://localhost:5173**

Navigate to **Data Sources** page and upload a CSV file!

---

## ✅ Verification Checklist

- [ ] FastAPI shows: `✅ Model loaded successfully!`
- [ ] Node.js shows: `Server running on http://localhost:3000`
- [ ] Frontend shows: `Local: http://localhost:5173/`
- [ ] Browser opens successfully
- [ ] CSV upload works
- [ ] Real-time processing shows results

---

## 📝 Full Documentation

See `RUN_PROJECT.md` for complete setup instructions and troubleshooting.





