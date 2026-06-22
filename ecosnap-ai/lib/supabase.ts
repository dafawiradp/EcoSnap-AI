// lib/supabase.ts
// Server-side Supabase client — import only in API routes and Server Components.
// Uses the service role key which has full database access and must never be
// exposed to the browser.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
