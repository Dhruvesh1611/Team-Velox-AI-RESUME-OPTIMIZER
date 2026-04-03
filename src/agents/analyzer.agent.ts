import { callAI } from "../services/ai.provider";

export type ResumeAnalysis = {
  skills: string[];
  weak_points: string[];
  missing_metrics: string[];
  keyword_gaps: string[];
  structure_issues: string[];
};

const ANALYZER_PROMPT = `
You are the Analyzer Agent for a production resume optimization pipeline.

Task:
- Analyze the provided resume text.
- Extract only information grounded in the resume text.
- Return strict JSON with no markdown, no code fences, and no extra commentary.

Required JSON schema:
{
  "skills": string[],
  "weak_points": string[],
  "missing_metrics": string[],
  "keyword_gaps": string[],
  "structure_issues": string[]
}

Rules:
- "skills": technical and professional skills explicitly present or strongly evidenced in the resume.
- "weak_points": vague language, weak phrasing, or weak sections found in the resume.
- "missing_metrics": places where achievements mention work but omit measurable outcomes.
- "keyword_gaps": important missing keywords or concepts that would improve ATS relevance based on the existing content.
- "structure_issues": formatting or organization problems visible from the text structure.
- Use empty arrays when needed.
- Output valid JSON only.
`.trim();

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseAnalysisResponse(rawResponse: string): ResumeAnalysis {
  const normalized = stripCodeFences(rawResponse);
  const parsed = JSON.parse(normalized) as Partial<ResumeAnalysis>;

  if (
    !parsed ||
    !Array.isArray(parsed.skills) ||
    !Array.isArray(parsed.weak_points) ||
    !Array.isArray(parsed.missing_metrics) ||
    !Array.isArray(parsed.keyword_gaps) ||
    !Array.isArray(parsed.structure_issues)
  ) {
    throw new Error("Analyzer returned invalid JSON structure.");
  }

  return {
    skills: parsed.skills.map(String),
    weak_points: parsed.weak_points.map(String),
    missing_metrics: parsed.missing_metrics.map(String),
    keyword_gaps: parsed.keyword_gaps.map(String),
    structure_issues: parsed.structure_issues.map(String),
  };
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  if (!resumeText.trim()) {
    throw new Error("Resume text is required for analysis.");
  }

  const prompt = `${ANALYZER_PROMPT}

Resume text:
"""
${resumeText}
"""`;

  const response = await callAI(prompt, {
    provider: "groq",
  });

  try {
    return parseAnalysisResponse(response);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to parse analyzer output: ${error.message}`
        : "Failed to parse analyzer output."
    );
  }
}
