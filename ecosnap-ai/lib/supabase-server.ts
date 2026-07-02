// lib/supabase-server.ts
//
// ⚠️  SERVER-ONLY — import ONLY in:
//   • app/api/**/route.ts  (Next.js API routes)
//   • async Server Components (no "use client" directive)
//   • lib/server-actions.ts and similar server utilities
//
// This client uses SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security
// and has full database access. It is NEVER included in the browser bundle
// because it references a non-NEXT_PUBLIC_ variable — Next.js strips it at
// build time for any code that is client-side.
//
// DO NOT import this file from:
//   • Files with "use client" at the top
//   • components/ (unless they are pure server components)
//   • lib/reports.ts or any helper called by browser code

import { createClient } from "@supabase/supabase-js";

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "[supabase-server] Missing env vars: " +
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. " +
    "Check your .env.local and restart the dev server."
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
