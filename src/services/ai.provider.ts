const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const DEFAULT_TEMPERATURE = 0.2;

type GroqMessage = {
  content?: string;
};

type GroqChoice = {
  message?: GroqMessage;
};

type GroqErrorResponse = {
  error?: {
    message?: string;
  };
};

type GroqSuccessResponse = {
  choices?: GroqChoice[];
};

export async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  if (!prompt.trim()) {
    throw new Error("Prompt must not be empty.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as GroqErrorResponse | null;
    const errorMessage =
      errorBody?.error?.message ??
      `Groq API request failed with status ${response.status}.`;

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as GroqSuccessResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Groq API returned an empty response.");
  }

  return content;
}
