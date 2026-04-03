import type { ResumeAnalysis } from "./analyzer.agent";
import { callAI } from "../services/ai.provider";

const OPTIMIZER_PROMPT = `
You are the Optimizer Agent for a production resume optimization pipeline.

Task:
- Rewrite the resume to improve clarity, impact, specificity, and structure.
- Use the provided analysis to guide the rewrite.
- Return only the optimized resume text.

Hard constraints:
- Do not invent or hallucinate any employers, job titles, dates, degrees, certifications, tools, awards, or metrics.
- Do not fabricate measurable results. If the original resume lacks numbers, improve phrasing without adding fake data.
- Preserve the candidate's factual background.
- Keep the output professional, concise, and ATS-friendly.
- Avoid meta commentary and do not mention the analysis.
`.trim();

export async function optimizeResume(
  resumeText: string,
  analysis: ResumeAnalysis
): Promise<string> {
  if (!resumeText.trim()) {
    throw new Error("Resume text is required for optimization.");
  }

  const prompt = `${OPTIMIZER_PROMPT}

Analysis JSON:
${JSON.stringify(analysis, null, 2)}

Original resume text:
"""
${resumeText}
"""`;

  const optimizedResume = await callAI(prompt, {
    provider: "groq",
  });
  const cleanedResume = optimizedResume.trim();

  if (!cleanedResume) {
    throw new Error("Optimizer returned an empty resume.");
  }

  return cleanedResume;
}
