import { callAI } from "./ai.provider";
import { budgetText } from "./prompt-budget.service";

export type MockInterviewItem = {
  question: string;
  answer_framework: string[];
};

type MockInterviewPayload = {
  questions: MockInterviewItem[];
};

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function generateMockInterview(params: {
  resumeText: string;
  jobDescription?: string;
}): Promise<MockInterviewItem[]> {
  const resume = budgetText(params.resumeText, 4500);
  const job = params.jobDescription?.trim()
    ? budgetText(params.jobDescription, 3500)
    : "";

  const prompt = `You are an interview coach for HireLens. Using ONLY details that appear in the resume (do not invent employers, dates, or metrics), propose interview preparation content.

Return strict JSON only — no markdown, no code fences.

Schema:
{
  "questions": [
    {
      "question": "string",
      "answer_framework": ["bullet hint 1", "bullet hint 2"]
    }
  ]
}

Rules:
- Exactly 6 questions.
- Mix behavioral and role-relevant technical questions tied to the resume.
- Each answer_framework has 2–4 short bullets: themes to mention, not a word-for-word script.
- If a job description is provided, bias questions toward that role; still do not fabricate resume facts.
${job ? `\nJob description:\n"""\n${job}\n"""\n` : ""}
Resume:
"""
${resume}
"""`;

  const raw = await callAI(prompt, { provider: "groq", temperature: 0.35 });
  const parsed = JSON.parse(stripCodeFences(raw)) as Partial<MockInterviewPayload>;

  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error("Mock interview response was not valid JSON.");
  }

  const rawList = parsed.questions as unknown[];

  return rawList
    .slice(0, 6)
    .map((entry) => {
      const item =
        entry && typeof entry === "object"
          ? (entry as { question?: unknown; answer_framework?: unknown })
          : {};
      const question = typeof item.question === "string" ? item.question.trim() : "";
      const framework = Array.isArray(item.answer_framework)
        ? item.answer_framework.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 5)
        : [];
      return { question, answer_framework: framework };
    })
    .filter((item) => item.question.length > 0);
}
