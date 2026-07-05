import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { fetchAllReports } from "@/lib/reports";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

function buildContext(reports: any[]) {
  const total = reports.length;

  const categories: Record<string, number> = {};
  const urgency: Record<string, number> = {};
  const provinces: Record<string, number> = {};

  for (const report of reports) {
    categories[report.pollution_category] =
      (categories[report.pollution_category] || 0) + 1;

    urgency[report.urgency_level] =
      (urgency[report.urgency_level] || 0) + 1;

    if (report.geo_province) {
      provinces[report.geo_province] =
        (provinces[report.geo_province] || 0) + 1;
    }
  }

  const latest = reports
    .slice(0, 20)
    .map((r) => ({
      category: r.pollution_category,
      waste: r.waste_type,
      urgency: r.urgency_level,
      province: r.geo_province,
      city: r.geo_city,
      confidence: r.confidence,
      created_at: r.created_at,
    }));

  return `
EcoSnap AI Environmental Database

Total Reports:
${total}

Category Counts:
${JSON.stringify(categories, null, 2)}

Urgency Counts:
${JSON.stringify(urgency, null, 2)}

Province Counts:
${JSON.stringify(provinces, null, 2)}

Latest Reports:
${JSON.stringify(latest, null, 2)}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const question = body.question;

    if (!question) {
      return NextResponse.json(
        {
          error: "Question is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data: reports, error } = await fetchAllReports();

    if (error || !reports) {
      return NextResponse.json(
        {
          error: "Unable to load reports.",
        },
        {
          status: 500,
        }
      );
    }

    const context = buildContext(reports);

    const prompt = `
You are EcoSnap AI.

You are an environmental analyst.

Answer ONLY using the provided database.

Never invent numbers.

If information is unavailable, say so.

Always provide concise answers.

Always recommend environmental actions when appropriate.

DATABASE

${context}

USER QUESTION

${question}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    return NextResponse.json({
      answer: response.text(),
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}