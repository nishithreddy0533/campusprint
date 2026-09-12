# CampusPrint — Supabase + Vercel Deployment Guide

## Step 1 — Create Supabase Project

1. Go to https://supabase.com and sign up / log in
2. Click "New Project", give it a name like `campusprint`
3. Choose a region close to India (e.g. Singapore)
4. Set a database password and create the project
5. Wait for it to provision (~2 minutes)

## Step 2 — Create the Orders Table

In Supabase dashboard → SQL Editor → New Query, paste and run:

```sql
CREATE TABLE IF NOT EXISTS orders (
  "orderId"                TEXT PRIMARY KEY,
  "studentName"            TEXT NOT NULL,
  "studentContact"         TEXT NOT NULL,
  "fileName"               TEXT NOT NULL,
  "fileUrl"                TEXT NOT NULL,
  "printType"              TEXT NOT NULL,
  pages                    INTEGER NOT NULL,
  copies                   INTEGER NOT NULL,
  binding                  TEXT NOT NULL,
  "specialInstructions"    TEXT DEFAULT '',
  cost                     INTEGER NOT NULL,
  "paymentStatus"          TEXT DEFAULT 'pending',
  "orderStatus"            TEXT DEFAULT 'received',
  "estimatedCompletionTime" TEXT,
  "rejectionReason"        TEXT,
  "createdAt"              TEXT NOT NULL,
  "updatedAt"              TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_student_contact ON orders ("studentContact");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders ("createdAt" DESC);
```

## Step 3 — Create Supabase Storage Bucket

1. Go to Storage in Supabase dashboard
2. Click "New Bucket"
3. Name it: `campusprint-uploads`
4. Check "Public bucket" so uploaded files are viewable
5. Click Create

## Step 4 — Get Supabase Credentials

Go to Project Settings → API:
- Copy "Project URL" → this is your `SUPABASE_URL`
- Copy "service_role" key (under Project API keys) → this is your `SUPABASE_SERVICE_ROLE_KEY`

## Step 5 — Push Code to GitHub

```bash
cd C:\Users\abina\Desktop\ctex1
git init
git add .
git commit -m "CampusPrint - Supabase + Vercel ready"
```

Create a new repo at https://github.com/new (name it `campusprint`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/campusprint.git
git push -u origin main
```

## Step 6 — Deploy Backend to Vercel

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Set Root Directory to `backend`
4. Framework Preset: Other
5. Add these Environment Variables:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
   - `SUPABASE_STORAGE_BUCKET` = campusprint-uploads
   - `STORAGE_BACKEND` = supabase
   - `JWT_SECRET` = any strong random string
   - `STAFF_USERNAME` = admin
   - `STAFF_PASSWORD` = your chosen password
   - `FRONTEND_URL` = * (set this to your frontend Vercel URL after deploying frontend)
6. Click Deploy
7. Copy the backend Vercel URL (e.g. `https://campusprint-backend.vercel.app`)

## Step 7 — Deploy Frontend to Vercel

1. Go to https://vercel.com → New Project
2. Import the same GitHub repo
3. Set Root Directory to `frontend`
4. Framework Preset: Vite
5. Add Environment Variable:
   - `VITE_API_URL` = your backend Vercel URL from Step 6
6. Click Deploy
7. Copy the frontend URL (e.g. `https://campusprint.vercel.app`)

## Step 8 — Update CORS

Go back to your backend Vercel project → Settings → Environment Variables:
- Update `FRONTEND_URL` to your actual frontend URL from Step 7
- Redeploy the backend

## Your app is live!

- Student app: `https://campusprint.vercel.app`
- Staff login: `https://campusprint.vercel.app/staff/login`
  - Username: admin
  - Password: (what you set in Step 6)
