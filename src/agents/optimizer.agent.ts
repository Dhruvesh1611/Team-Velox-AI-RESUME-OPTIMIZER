import type { ResumeAnalysis } from "./analyzer.agent";
import { callAI } from "../services/ai.provider";
import { budgetText } from "../services/prompt-budget.service";

const OPTIMIZER_PROMPT = `
You are the Optimizer Agent for a production resume optimization pipeline.

Task:
- Rewrite the resume to improve clarity, impact, specificity, and structure.
- Use the provided analysis to guide the rewrite.
- When a target job description is provided, align tone and keywords naturally without fabricating experience.
- Return only the optimized resume text.

Hard constraints:
- Do not invent or hallucinate any employers, job titles, dates, degrees, certifications, tools, awards, or metrics.
- Do not fabricate measurable results. Include numeric metrics only when explicitly present in the source resume.
- If metrics are not present, use strong qualitative impact language instead (for example: optimized application performance, enhanced user experience and responsiveness, improved system efficiency and scalability, streamlined workflows and reduced complexity, increased reliability and maintainability).
- Ensure every bullet point communicates impact (quantitative when available, otherwise qualitative).
- Never use vague phrasing such as "worked on", "responsible for", or "involved in". Rewrite using strong action verbs like Developed, Engineered, Implemented, Optimized, Designed.
- Preserve the candidate's factual background.
- Keep the output professional, concise, and ATS-friendly.
- Avoid meta commentary and do not mention the analysis.
`.trim();

export async function optimizeResume(
  resumeText: string,
  analysis: ResumeAnalysis,
  jobDescription?: string
): Promise<string> {
  if (!resumeText.trim()) {
    throw new Error("Resume text is required for optimization.");
  }

  const budgetedResumeText = budgetText(resumeText, 7000);
  const jobBlock = jobDescription?.trim()
    ? `Target job description:\n"""\n${budgetText(jobDescription, 4000)}\n"""\n\n`
    : "";

  const prompt = `${OPTIMIZER_PROMPT}

${jobBlock}Analysis JSON:
${JSON.stringify(analysis, null, 2)}

Original resume text:
"""
${budgetedResumeText}
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
