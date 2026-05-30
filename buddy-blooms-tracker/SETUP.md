# Buddy Blooms Project Tracker — Setup Guide

A step-by-step guide to get the dashboard live on GitHub → Vercel, backed by Supabase.

---

## Step 1 — Supabase (database)

1. Go to https://supabase.com and sign in (or create a free account).
2. Click **New project**. Give it a name like `buddy-blooms`. Choose a region close to you. Set a database password and save it somewhere safe.
3. Wait ~1 minute for the project to provision.
4. In the left sidebar go to **SQL Editor** → **New query**.
5. Open the file `supabase/schema.sql` from this project, copy the entire contents, paste it into the SQL editor, and click **Run**.
   - This creates the `tasks` table and seeds it with the starter tasks.
6. Go to **Project Settings** (gear icon) → **API**.
7. Copy two values — you'll need them in Step 3:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (long string under "Project API keys")

---

## Step 2 — GitHub (code repository)

1. Go to https://github.com and sign in.
2. Click **New repository**. Name it `buddy-blooms-tracker`. Set it to **Private**. Do not initialise with a README.
3. On your computer, open Terminal (Mac) or Command Prompt (Windows).
4. Navigate to this project folder:
   ```
   cd path/to/buddy-blooms-tracker
   ```
5. Run these commands one at a time:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/buddy-blooms-tracker.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3 — Vercel (hosting + environment variables)

1. Go to https://vercel.com and sign in with your GitHub account.
2. Click **Add New → Project**.
3. Find and select your `buddy-blooms-tracker` repository. Click **Import**.
4. Vercel will detect it as a Vite project automatically. Before clicking Deploy, expand **Environment Variables** and add:

   | Name                    | Value                              |
   |-------------------------|------------------------------------|
   | `VITE_SUPABASE_URL`     | Your Supabase Project URL (Step 1) |
   | `VITE_SUPABASE_ANON_KEY`| Your Supabase anon key (Step 1)    |

5. Click **Deploy**. Vercel will build and deploy in about 1 minute.
6. Your dashboard is now live at a URL like `https://buddy-blooms-tracker.vercel.app`.

---

## Step 4 — Share with Cece

Send Cece the Vercel URL. That's it — both of you open the same URL and all changes save instantly to the shared Supabase database.

---

## Making updates later

Any time you edit the code and push to GitHub, Vercel will automatically redeploy:
```
git add .
git commit -m "describe your change"
git push
```

---

## Project structure

```
buddy-blooms-tracker/
├── index.html          ← App entry point
├── package.json        ← Dependencies
├── vite.config.js      ← Vite config
├── .env.example        ← Copy to .env for local dev
├── .gitignore
├── supabase/
│   └── schema.sql      ← Run this in Supabase SQL Editor
└── src/
    ├── main.jsx        ← React entry point
    ├── supabase.js     ← Supabase client
    └── App.jsx         ← Full dashboard
```

## Local development

To run locally:
1. Copy `.env.example` to `.env` and fill in your Supabase credentials.
2. Run:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:5173
