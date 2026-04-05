import { callAI } from "../services/ai.provider";
import { budgetText } from "../services/prompt-budget.service";

const ENRICHMENT_PROMPT = `
SYSTEM:
You are a senior software engineer and hiring expert.

TASK:
Improve and enrich the resume content.

RULES:
- Expand weak bullet points into strong professional statements
- Add technical depth (architecture, tools, decisions)
- NEVER fabricate numeric metrics (%, users, revenue, counts, performance numbers)
- Include measurable data only when explicitly present in source text
- If measurable data is missing, use qualitative impact language (for example: optimized application performance, enhanced user experience and responsiveness, improved system efficiency and scalability, streamlined workflows and reduced complexity, increased reliability and maintainability)
- Ensure every bullet communicates impact (quantitative when available, otherwise qualitative)
- Never use vague phrasing such as "worked on", "responsible for", or "involved in". Rewrite with strong action verbs like Developed, Engineered, Implemented, Optimized, Designed.
- Improve clarity and readability
- Keep content believable and consistent
- Do NOT invent fake companies, roles, or achievements
- Preserve original meaning

OUTPUT:
Return improved resume text only (no JSON, no explanation)
`.trim();

export async function enrichResume(resumeText: string): Promise<string> {
  const trimmedResume = resumeText.trim();

  if (!trimmedResume) {
    throw new Error("Resume text is required for enrichment.");
  }

  const prompt = `${ENRICHMENT_PROMPT}

Resume:
"""
${budgetText(trimmedResume, 7000)}
"""`;

  const enrichedResume = await callAI(prompt, {
    provider: "groq",
    temperature: 0.2,
  });
  const cleanedResume = enrichedResume.trim();

  if (!cleanedResume) {
    throw new Error("Enrichment agent returned an empty resume.");
  }

  return cleanedResume;
}
