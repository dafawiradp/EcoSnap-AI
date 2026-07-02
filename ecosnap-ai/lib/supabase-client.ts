// lib/supabase-client.ts
// Browser-side Supabase client singleton — safe to import in Client Components.
// Uses the anon key which is intentionally public and has limited RLS-controlled access.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL    ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ── Startup diagnostics (only in dev, never prints secrets) ──────────────────
if (process.env.NODE_ENV === "development") {
  const urlOk  = supabaseUrl.startsWith("https://") && supabaseUrl.includes(".supabase.co");
  const keyOk  = supabaseAnonKey.length > 100; // real JWT tokens are ~200 chars

  console.group("[supabase-client] Environment check");
  console.log("NEXT_PUBLIC_SUPABASE_URL     :", urlOk
    ? `✅ looks valid (${supabaseUrl.length} chars)`
    : `❌ looks like placeholder — value is "${supabaseUrl.slice(0, 40)}…" (${supabaseUrl.length} chars)`
  );
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", keyOk
    ? `✅ looks valid (${supabaseAnonKey.length} chars)`
    : `❌ looks like placeholder — too short (${supabaseAnonKey.length} chars, expected ~200)`
  );
  if (!urlOk || !keyOk) {
    console.warn(
      "[supabase-client] ⚠️  Placeholder credentials detected.\n" +
      "Copy real values from: Supabase Dashboard → Project Settings → API\n" +
      "Then update ecosnap-ai/.env.local and restart the dev server."
    );
  }
  console.groupEnd();
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
