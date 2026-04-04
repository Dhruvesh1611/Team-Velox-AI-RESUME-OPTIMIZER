import { callAI } from "../services/ai.provider";
import { budgetText } from "../services/prompt-budget.service";

export type ResumeReview = {
  improvement_score: number;
  clarity_improvement: string;
  impact_improvement: string;
  keyword_relevance: string;
  final_summary: string;
  /** 0–100 heuristic estimate; not a guarantee of hiring outcomes */
  placement_readiness_score: number;
  placement_summary: string;
  role_strengths: string[];
  role_gaps: string[];
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
  "final_summary": string,
  "placement_readiness_score": number,
  "placement_summary": string,
  "role_strengths": string[],
  "role_gaps": string[]
}

Rules:
- "improvement_score" must be an integer from 0 to 100 (quality of the optimization vs original).
- "placement_readiness_score" must be an integer from 0 to 100 estimating how interview-ready the optimized resume is for the stated target (or generally if no job description).
- "placement_summary": one short paragraph; be honest and avoid overclaiming.
- "role_strengths" and "role_gaps": up to 6 items each, grounded in the resume text.
- If a target job description is provided, align keyword_relevance and placement fields to it.
- Each string field must be concise and specific.
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

  const placementRaw =
    typeof parsed.placement_readiness_score === "number"
      ? Math.round(parsed.placement_readiness_score)
      : normalizedScore;
  const placementScore = Math.max(0, Math.min(100, placementRaw));

  const strengths = Array.isArray(parsed.role_strengths)
    ? parsed.role_strengths.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];
  const gaps = Array.isArray(parsed.role_gaps)
    ? parsed.role_gaps.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    improvement_score: normalizedScore,
    clarity_improvement: parsed.clarity_improvement.trim(),
    impact_improvement: parsed.impact_improvement.trim(),
    keyword_relevance: parsed.keyword_relevance.trim(),
    final_summary: parsed.final_summary.trim(),
    placement_readiness_score: placementScore,
    placement_summary:
      typeof parsed.placement_summary === "string" && parsed.placement_summary.trim()
        ? parsed.placement_summary.trim()
        : parsed.final_summary.trim(),
    role_strengths: strengths,
    role_gaps: gaps,
  };
}

export async function reviewResume(
  original: string,
  optimized: string,
  jobDescription?: string
): Promise<ResumeReview> {
  if (!original.trim() || !optimized.trim()) {
    throw new Error("Both original and optimized resume text are required for review.");
  }

  const budgetedOriginal = budgetText(original, 5000);
  const budgetedOptimized = budgetText(optimized, 5000);
  const jobBlock = jobDescription?.trim()
    ? `Target job description (for relevance and placement estimate):\n"""\n${budgetText(jobDescription, 3500)}\n"""\n\n`
    : "";

  const prompt = `${REVIEWER_PROMPT}

${jobBlock}Original resume:
"""
${budgetedOriginal}
"""

Optimized resume:
"""
${budgetedOptimized}
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
