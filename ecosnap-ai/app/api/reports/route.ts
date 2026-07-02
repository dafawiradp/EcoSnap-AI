// app/api/reports/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    // 2.6.2 — Parse multipart/form-data
    const formData = await request.formData();
    const photo = formData.get("photo") as File | null;
    const location = (formData.get("location") as string | null)?.trim() ?? "";
    const description =
      (formData.get("description") as string | null)?.trim() ?? "";

    // 2.6.3 — Validate required fields
    if (!photo || !location) {
      return NextResponse.json(
        { error: "Photo and location are required." },
        { status: 400 }
      );
    }

    // Additional server-side file validation (defence in depth)
    if (!ACCEPTED_MIME_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP files are accepted." },
        { status: 400 }
      );
    }
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be smaller than 10 MB." },
        { status: 400 }
      );
    }

    // 2.6.4 — Upload photo to Supabase Storage
    const fileExtension = photo.name.split(".").pop() ?? "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const arrayBuffer = await photo.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseServer.storage
      .from("report-photos")
      .upload(fileName, fileBuffer, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload photo. Please try again." },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from("report-photos").getPublicUrl(fileName);

    // 2.6.5 — Stub classify, score, recommend (replaced in Task 3.4)
    const pollution_category = "plastic_waste";
    const urgency_level = "Low";
    const recommended_actions = ["Document the location with additional photos"];

    // 2.6.6 — Insert into reports table and return the full row
    const { data: report, error: dbError } = await supabaseServer
      .from("reports")
      .insert({
        photo_url: publicUrl,
        location,
        description,
        pollution_category,
        urgency_level,
        recommended_actions,
      })
      .select()
      .single();

    if (dbError || !report) {
      console.error("Database insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to save report. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    // 2.6.7 — Return 500 with descriptive error for any unexpected failure
    console.error("Unexpected error in POST /api/reports:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
