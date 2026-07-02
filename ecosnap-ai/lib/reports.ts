/**
 * lib/reports.ts
 *
 * Reusable service functions for the `reports` table.
 * All functions use the browser-safe anon key client (supabaseClient) so they
 * can be called directly from Client Components without going through an API
 * route.  No auth is required for the hackathon MVP.
 */

import { supabaseClient } from "@/lib/supabase-client";
import type { NewReport, Report } from "@/types/report";

// ── Result wrapper ────────────────────────────────────────────────────────────
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Logs every field of a Supabase PostgREST error for easy diagnosis. */
function logSupabaseError(label: string, error: unknown) {
  if (!error || typeof error !== "object") {
    console.error(`${label} unexpected error:`, error);
    return;
  }
  const e = error as Record<string, unknown>;
  console.group(`${label} Supabase error`);
  console.error("  code   :", e["code"]    ?? "(none)");
  console.error("  message:", e["message"] ?? "(none)");
  console.error("  details:", e["details"] ?? "(none)");
  console.error("  hint   :", e["hint"]    ?? "(none)");

  // Diagnose the most common failure modes
  const code    = String(e["code"]    ?? "");
  const message = String(e["message"] ?? "").toLowerCase();

  if (message.includes("failed to fetch") || message.includes("networkerror")) {
    console.warn(
      "  → LIKELY CAUSE: NEXT_PUBLIC_SUPABASE_URL is wrong or unreachable.\n" +
      "    Check that .env.local has the real URL and the dev server was restarted."
    );
  }
  if (code === "42P01") {
    console.warn(
      "  → LIKELY CAUSE: Table \"reports\" does not exist.\n" +
      "    Run the SQL in ecosnap-ai/supabase/schema.sql in the Supabase SQL Editor."
    );
  }
  if (code === "42703") {
    console.warn(
      "  → LIKELY CAUSE: Column does not exist in the table.\n" +
      "    Run the ALTER TABLE migration lines in supabase/schema.sql."
    );
  }
  if (code === "42501" || message.includes("row-level security") || message.includes("rls")) {
    console.warn(
      "  → LIKELY CAUSE: Row Level Security (RLS) is blocking the operation.\n" +
      "    In Supabase Dashboard → Authentication → Policies, add policies for\n" +
      "    INSERT and SELECT on the \"reports\" table, or disable RLS for the table."
    );
  }
  if (code === "PGRST301") {
    console.warn(
      "  → LIKELY CAUSE: Connection refused — wrong URL or project is paused."
    );
  }
  if (message.includes("jwt") || message.includes("apikey") || message.includes("unauthorized")) {
    console.warn(
      "  → LIKELY CAUSE: NEXT_PUBLIC_SUPABASE_ANON_KEY is invalid.\n" +
      "    Copy the real anon key from Supabase Dashboard → Project Settings → API."
    );
  }
  console.groupEnd();
}

// ── Insert a new report ───────────────────────────────────────────────────────

/**
 * Persists a new pollution report to the `reports` table.
 */
export async function createReport(
  payload: NewReport
): Promise<ServiceResult<Report>> {
  if (process.env.NODE_ENV === "development") {
    console.group("[createReport] INSERT payload");
    console.log("  photo_url           :", payload.photo_url);
    console.log("  location            :", payload.location);
    console.log("  description         :", payload.description?.slice(0, 80) + (payload.description?.length > 80 ? "…" : ""));
    console.log("  pollution_category  :", payload.pollution_category);
    console.log("  urgency_level       :", payload.urgency_level);
    console.log("  recommended_actions :", payload.recommended_actions);
    console.log("  confidence          :", payload.confidence, "(type:", typeof payload.confidence, ")");
    console.log("  latitude            :", payload.latitude,  "(type:", typeof payload.latitude,  ")");
    console.log("  longitude           :", payload.longitude, "(type:", typeof payload.longitude, ")");
    console.groupEnd();
  }

  try {
    const { data, error } = await supabaseClient
      .from("reports")
      .insert(payload)
      .select()
      .single();

    if (error) {
      logSupabaseError("[createReport]", error);
      return {
        data: null,
        error: mapSupabaseError(error.code, error.message),
      };
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[createReport] ✅ success — id:", (data as Record<string, unknown>)["id"]);
    }

    return { data: data as Report, error: null };
  } catch (err) {
    // Network-level failure (wrong URL, CORS, no internet)
    const msg = err instanceof Error ? err.message : String(err);
    console.group("[createReport] Network / runtime error");
    console.error("  message:", msg);
    if (msg.toLowerCase().includes("failed to fetch")) {
      console.warn(
        "  → LIKELY CAUSE: NEXT_PUBLIC_SUPABASE_URL is unreachable.\n" +
        "    Value is currently:", process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(undefined)"
      );
    }
    console.groupEnd();
    return {
      data: null,
      error: "Could not connect to the database. Please try again.",
    };
  }
}

// ── Fetch all reports (dashboard) ─────────────────────────────────────────────

/**
 * Fetches all reports ordered by most recent first.
 */
export async function fetchAllReports(): Promise<ServiceResult<Report[]>> {
  try {
    const { data, error } = await supabaseClient
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logSupabaseError("[fetchAllReports]", error);
      return {
        data: null,
        error: mapSupabaseError(error.code, error.message),
      };
    }

    return { data: (data ?? []) as Report[], error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.group("[fetchAllReports] Network / runtime error");
    console.error("  message:", msg);
    console.groupEnd();
    return {
      data: null,
      error: "Could not connect to the database. Please try again.",
    };
  }
}

// ── Fetch a single report by ID ───────────────────────────────────────────────

/**
 * Fetches a single report by its UUID.
 */
export async function fetchReportById(
  id: string
): Promise<ServiceResult<Report>> {
  try {
    const { data, error } = await supabaseClient
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logSupabaseError("[fetchReportById]", error);
      return {
        data: null,
        error:
          error.code === "PGRST116"
            ? "Report not found."
            : mapSupabaseError(error.code, error.message),
      };
    }

    return { data: data as Report, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.group("[fetchReportById] Network / runtime error");
    console.error("  message:", msg);
    console.groupEnd();
    return {
      data: null,
      error: "Could not connect to the database. Please try again.",
    };
  }
}

// ── Error mapping ─────────────────────────────────────────────────────────────

/**
 * Translates known Supabase / PostgREST error codes into user-friendly messages.
 */
function mapSupabaseError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "42P01":  return "Database table not found. Please contact support.";
    case "42703":  return "Database column mismatch. Please contact support.";
    case "PGRST301": return "Database connection failed. Please try again later.";
    case "42501":  return "Permission denied. Please contact support.";
    case "23505":  return "A duplicate record already exists.";
    case "57014":  return "The request timed out. Please try again.";
    default:
      return process.env.NODE_ENV === "development"
        ? fallback
        : "A database error occurred. Please try again.";
  }
}
