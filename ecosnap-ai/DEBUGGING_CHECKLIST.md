# EcoSnap AI — Backend Failure Debugging Checklist

## Symptoms Observed

- `createReport()` returns "Failed to fetch"
- Dashboard shows no reports
- Browser console shows:
  ```
  [createReport] Supabase insert error: {}
  [fetchAllReports] Supabase error: {}
  ```

---

## Root Cause (CONFIRMED)

**Environment variables in `.env.local` are still using placeholder values from `.env.example`.**

Verified via:
```powershell
Get-Content ecosnap-ai/.env.local
```

Results:
- `NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co` (36 chars)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here` (18 chars)
- `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here` (26 chars)

Real Supabase credentials:
- URL is `https://xxxxxxxxxxxx.supabase.co` (~40 chars)
- Anon key is a ~200-char JWT token
- Service role key is a ~200-char JWT token

---

## Complete Backend Failure Checklist

### ✅ 1. Environment Variables

**Symptom:** `Failed to fetch` / network error / empty error objects

**Check:**
- [ ] `.env.local` exists in the `ecosnap-ai/` directory
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is a real project URL (not `https://your-project-ref.supabase.co`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is ~200 chars (not `your-anon-key-here`)
- [ ] Dev server was restarted after changing `.env.local`

**How to fix:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the **URL** and **anon (public) key**
3. Paste into `ecosnap-ai/.env.local`
4. Restart the dev server (`Ctrl+C`, then `npm run dev`)

---

### ✅ 2. Table Existence

**Symptom:** `code: "42P01"` / "table does not exist"

**Check:**
- [ ] The `reports` table exists in Supabase

**How to fix:**
1. Go to Supabase Dashboard → SQL Editor → New query
2. Paste the entire contents of `ecosnap-ai/supabase/schema.sql`
3. Run the query
4. Verify the table appears in Table Editor

---

### ✅ 3. Column Mismatch

**Symptom:** `code: "42703"` / "column does not exist"

**Check:**
- [ ] All columns in the TypeScript `NewReport` type match the table schema
- [ ] The `confidence`, `latitude`, `longitude` columns exist (added later)

**How to fix:**
Run the migration section of `schema.sql`:
```sql
alter table reports add column if not exists confidence  integer not null default 0;
alter table reports add column if not exists latitude    double precision;
alter table reports add column if not exists longitude   double precision;
```

---

### ✅ 4. Row Level Security (RLS)

**Symptom:** `code: "42501"` / "permission denied" / "new row violates row-level security"

**Check:**
- [ ] RLS is **disabled** on the `reports` table, OR
- [ ] RLS policies exist for `INSERT` and `SELECT` on `reports`

**How to fix:**

**Option A — Disable RLS (fast, good for MVP):**
```sql
alter table reports disable row level security;
```

**Option B — Add permissive policies:**
```sql
-- Allow anyone to insert
create policy "Allow anonymous inserts" on reports
  for insert with check (true);

-- Allow anyone to read
create policy "Allow anonymous reads" on reports
  for select using (true);
```

---

### ✅ 5. Type Mismatches

**Symptom:** Payload logged correctly but insert fails silently

**Check:**
- [ ] `confidence` is `number` (not string) — maps to `integer`
- [ ] `latitude` / `longitude` are `number | null` — map to `double precision`
- [ ] `recommended_actions` is `string[]` — maps to `text[]`

**Current payload (logged in browser console):**
```ts
{
  photo_url:           "/placeholder-photo.jpg",
  location:            "...",
  description:         "...",
  pollution_category:  "plastic_waste",
  urgency_level:       "Low",
  recommended_actions: ["...", "...", "..."],
  confidence:          79,       // ✅ number
  latitude:            41.8781,  // ✅ number | null
  longitude:           -87.6298, // ✅ number | null
}
```

All types are correct. ✅

---

### ✅ 6. Table Name Case Sensitivity

**Check:**
- [ ] Table name in code is `"reports"` (lowercase)
- [ ] Table name in Supabase is `reports` (lowercase)

Postgres is case-sensitive when table names are quoted. Confirmed: both use `reports` lowercase. ✅

---

### ✅ 7. Network / CORS Issues

**Symptom:** `Failed to fetch` / no response / `NetworkError`

**Check:**
- [ ] Supabase project is not paused (free tier pauses after inactivity)
- [ ] No browser extensions blocking requests (try incognito mode)
- [ ] No firewall / antivirus blocking Supabase domain

**How to test:**
Open browser DevTools → Network tab → try the insert → check for:
- Red failed request
- Status code (e.g., 401, 403, 404, 500)
- Response body

---

### ✅ 8. Anon Key Invalid / Expired

**Symptom:** `JWT` error / `apikey` error / `unauthorized`

**Check:**
- [ ] Anon key is copied correctly (no extra spaces / line breaks)
- [ ] Anon key matches the current project (not from a different project)

**How to fix:**
Re-copy the anon key from Supabase Dashboard → Project Settings → API

---

### ✅ 9. Storage Bucket Missing (for real photo uploads)

**Symptom:** Photo upload fails when wiring real storage

**Check:**
- [ ] A public bucket named `report-photos` exists
- [ ] Bucket policy allows public reads

**Not relevant yet** — currently using a placeholder URL. ✅

---

### ✅ 10. Next.js Not Reading .env.local

**Symptom:** `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)` shows `undefined`

**Check:**
- [ ] `.env.local` is in the **root of `ecosnap-ai/`** (not one level up)
- [ ] File is named **exactly** `.env.local` (not `.env.local.txt`)
- [ ] Dev server was restarted after creating/editing the file

**How to test:**
Add a temporary log:
```ts
console.log("URL from env:", process.env.NEXT_PUBLIC_SUPABASE_URL);
```
Refresh browser → check console. If `undefined`, Next.js isn't reading the file.

---

## Improved Diagnostics (Already Applied)

### `lib/supabase-client.ts`

Now logs at startup (dev only):
```
[supabase-client] Environment check
  NEXT_PUBLIC_SUPABASE_URL     : ❌ looks like placeholder — value is "https://your-project-ref.supab…" (36 chars)
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ❌ looks like placeholder — too short (18 chars, expected ~200)
  ⚠️  Placeholder credentials detected.
      Copy real values from: Supabase Dashboard → Project Settings → API
      Then update ecosnap-ai/.env.local and restart the dev server.
```

### `lib/reports.ts`

Every Supabase error now logs:
- `code`
- `message`
- `details`
- `hint`
- **Auto-diagnoses** common failure modes (table missing, RLS blocking, wrong URL, etc.)

Every `createReport()` call logs the full INSERT payload (types visible).

---

## Next Steps to Fix the Actual Issue

1. **Get real Supabase credentials**
   - Supabase Dashboard → Project Settings → API
   - Copy **URL** and **anon key**

2. **Update `.env.local`**
   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (200+ chars)
   ```

3. **Restart the dev server**
   ```bash
   # Stop the current dev server (Ctrl+C)
   npm run dev
   ```

4. **Run the schema SQL** (if not done already)
   - Supabase Dashboard → SQL Editor → New query
   - Paste contents of `ecosnap-ai/supabase/schema.sql`
   - Click "Run"

5. **Check RLS**
   - Supabase Dashboard → Table Editor → `reports` → click "RLS" toggle
   - Either **disable RLS** or add permissive policies (see checklist item #4)

6. **Test in browser**
   - Open DevTools Console
   - Submit a report
   - Console will now show:
     - Environment check (startup)
     - Full INSERT payload
     - Detailed error diagnostics (if any)
     - Success confirmation with report ID

---

## Expected Console Output (After Fix)

**Startup:**
```
[supabase-client] Environment check
  NEXT_PUBLIC_SUPABASE_URL     : ✅ looks valid (42 chars)
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ looks valid (217 chars)
```

**On submit:**
```
[createReport] INSERT payload
  photo_url           : /placeholder-photo.jpg
  location            : Riverside Park — 41.8781, -87.6298
  description         : Plastic bottles scattered near the water…
  pollution_category  : plastic_waste
  urgency_level       : Low
  recommended_actions : [ "Organize a community cleanup", "Document the location with additional photos" ]
  confidence          : 79 (type: number)
  latitude            : 41.8781 (type: number)
  longitude           : -87.6298 (type: number)

[createReport] ✅ success — id: a1b2c3d4-...
```

If still failing, the console will show **exactly which checklist item** is the problem.
