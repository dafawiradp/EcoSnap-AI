export interface AssistantResponse {
  answer: string;
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export async function askAssistant(
  question: string
): Promise<AssistantResponse> {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to contact assistant");
  }

  return data;
}