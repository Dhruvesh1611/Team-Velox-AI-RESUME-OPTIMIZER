const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const HUGGING_FACE_API_URL = "https://router.huggingface.co/v1/chat/completions";

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const DEFAULT_HUGGING_FACE_MODEL =
  process.env.HUGGINGFACE_MODEL ?? "openai/gpt-oss-120b:fastest";
const DEFAULT_TEMPERATURE = 0.2;

export type AIProvider = "gemini" | "groq" | "huggingface";

export type CallAIOptions = {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
};

type ChatMessage = {
  content?: string;
};

type ChatChoice = {
  message?: ChatMessage;
};

type ProviderErrorResponse = {
  error?: {
    message?: string;
  };
};

type ChatSuccessResponse = {
  choices?: ChatChoice[];
};

type GeminiPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiSuccessResponse = {
  candidates?: GeminiCandidate[];
};

function resolveModel(provider: AIProvider, explicitModel?: string): string {
  if (explicitModel) {
    return explicitModel;
  }

  if (provider === "gemini") {
    return DEFAULT_GEMINI_MODEL;
  }

  if (provider === "huggingface") {
    return DEFAULT_HUGGING_FACE_MODEL;
  }

  return DEFAULT_GROQ_MODEL;
}

async function callGroq(
  prompt: string,
  model: string,
  temperature: number
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
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
    const errorBody = (await response.json().catch(() => null)) as ProviderErrorResponse | null;
    const errorMessage =
      errorBody?.error?.message ??
      `Groq API request failed with status ${response.status}.`;

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as ChatSuccessResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Groq API returned an empty response.");
  }

  return content;
}

async function callGemini(
  prompt: string,
  model: string,
  temperature: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const response = await fetch(`${GEMINI_API_URL}/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ProviderErrorResponse | null;
    const errorMessage =
      errorBody?.error?.message ??
      `Gemini API request failed with status ${response.status}.`;

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as GeminiSuccessResponse;
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!content) {
    throw new Error("Gemini API returned an empty response.");
  }

  return content;
}

async function callHuggingFace(
  prompt: string,
  model: string,
  temperature: number
): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing HUGGINGFACE_API_KEY environment variable.");
  }

  const response = await fetch(HUGGING_FACE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ProviderErrorResponse | null;
    const errorMessage =
      errorBody?.error?.message ??
      `Hugging Face API request failed with status ${response.status}.`;

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as ChatSuccessResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Hugging Face API returned an empty response.");
  }

  return content;
}

export async function callAI(
  prompt: string,
  options: CallAIOptions = {}
): Promise<string> {
  if (!prompt.trim()) {
    throw new Error("Prompt must not be empty.");
  }

  const provider = options.provider ?? "groq";
  const model = resolveModel(provider, options.model);
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;

  if (process.env.AI_DEBUG === "1") {
    console.info("[ai]", provider, model);
  }

  if (provider === "gemini") {
    return callGemini(prompt, model, temperature);
  }

  if (provider === "huggingface") {
    return callHuggingFace(prompt, model, temperature);
  }

  return callGroq(prompt, model, temperature);
}
