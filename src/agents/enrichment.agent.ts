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
- Add realistic metrics ONLY if implied (DO NOT hallucinate fake numbers)
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
