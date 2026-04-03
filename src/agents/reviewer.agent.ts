import { callAI } from "../services/ai.provider";

export type ResumeReview = {
  improvement_score: number;
  clarity_improvement: string;
  impact_improvement: string;
  keyword_relevance: string;
  final_summary: string;
};

const REVIEWER_PROMPT = `
You are the Reviewer Agent for a production resume optimization pipeline.

Task:
- Compare the original resume with the optimized resume.
- Evaluate whether the optimized version is clearer, stronger, and better structured.
- Return strict JSON only with no markdown, no code fences, and no extra commentary.

Required JSON schema:
{
  "improvement_score": number,
  "clarity_improvement": string,
  "impact_improvement": string,
  "keyword_relevance": string,
  "final_summary": string
}

Rules:
- "improvement_score" must be an integer from 0 to 100.
- Each string field must be concise and specific to the changes visible in the optimized resume.
- Output valid JSON only.
`.trim();

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseReviewResponse(rawResponse: string): ResumeReview {
  const normalized = stripCodeFences(rawResponse);
  const parsed = JSON.parse(normalized) as Partial<ResumeReview>;

  if (
    !parsed ||
    typeof parsed.improvement_score !== "number" ||
    typeof parsed.clarity_improvement !== "string" ||
    typeof parsed.impact_improvement !== "string" ||
    typeof parsed.keyword_relevance !== "string" ||
    typeof parsed.final_summary !== "string"
  ) {
    throw new Error("Reviewer returned invalid JSON structure.");
  }

  const normalizedScore = Math.max(
    0,
    Math.min(100, Math.round(parsed.improvement_score))
  );

  return {
    improvement_score: normalizedScore,
    clarity_improvement: parsed.clarity_improvement.trim(),
    impact_improvement: parsed.impact_improvement.trim(),
    keyword_relevance: parsed.keyword_relevance.trim(),
    final_summary: parsed.final_summary.trim(),
  };
}

export async function reviewResume(
  original: string,
  optimized: string
): Promise<ResumeReview> {
  if (!original.trim() || !optimized.trim()) {
    throw new Error("Both original and optimized resume text are required for review.");
  }

  const prompt = `${REVIEWER_PROMPT}

Original resume:
"""
${original}
"""

Optimized resume:
"""
${optimized}
"""`;

  const response = await callAI(prompt, {
    provider: "huggingface",
  });

  try {
    return parseReviewResponse(response);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to parse reviewer output: ${error.message}`
        : "Failed to parse reviewer output."
    );
  }
}
