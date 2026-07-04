import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function analyzeImage(file: File): Promise<string> {

  const bytes = await file.arrayBuffer();

  const base64 = Buffer.from(bytes).toString("base64");

  const result = await model.generateContent([

    {
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    },

    `
You are an environmental scientist.

Look at this image carefully.

Describe ONLY what you actually see.

Mention:

- pollution type
- waste material
- environment
- objects
- water
- smoke
- fire
- road
- river
- factory
- vegetation

Return ONE short paragraph only.

Do not guess location.

Do not explain.

Do not use markdown.
`,

  ]);

  return result.response.text();

}