/**
 * lib/storage.ts
 *
 * Photo upload service for Supabase Storage.
 * Uses the browser-safe anon key client so it can be called from
 * Client Components without going through an API route.
 *
 * The `report-photos` bucket must exist and have:
 *   - anon INSERT policy  (allow uploads)
 *   - public SELECT       (allow public URL access)
 * See supabase/schema.sql for the full setup.
 */

import { supabaseClient } from "@/lib/supabase-client";

const BUCKET = "report-photos";
const PLACEHOLDER_URL = "/placeholder-photo.jpg";

export interface UploadResult {
  /** Public URL on success, placeholder URL on failure */
  url:   string;
  /** null on success, error message on failure */
  error: string | null;
}

/**
 * Uploads a photo File to Supabase Storage and returns its public URL.
 * Falls back gracefully to the placeholder URL if the upload fails.
 *
 * @param file - The image File to upload (JPEG / PNG / WebP)
 */
export async function uploadPhoto(file: File): Promise<UploadResult> {
  try {
    // Generate a unique path: {uuid}.{ext}
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[uploadPhoto] Supabase Storage upload failed:", uploadError.message);
      }
      return { url: PLACEHOLDER_URL, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === "development") {
      console.warn("[uploadPhoto] Unexpected error:", msg);
    }
    return { url: PLACEHOLDER_URL, error: msg };
  }
}
