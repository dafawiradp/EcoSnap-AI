// lib/supabase-client.ts
// Browser-side Supabase client singleton — safe to import in Client Components.
// Uses the anon key which is intentionally public and has limited RLS-controlled access.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
