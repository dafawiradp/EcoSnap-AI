import { NextRequest, NextResponse } from "next/server";
import { model } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.prompt) {
      return NextResponse.json(
        {
          success: false,
          message: "Prompt is required",
        },
        {
          status: 400,
        }
      );
    }

    const result = await model.generateContent(body.prompt);

    const text = result.response.text();

    return NextResponse.json({
      success: true,
      message: text,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}