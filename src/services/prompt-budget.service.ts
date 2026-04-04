const DEFAULT_MAX_CHARS = 8000;

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function looksLikePdfBinaryText(value: string): boolean {
  const sample = normalizeWhitespace(value).slice(0, 2000);
  if (!sample) return false;

  const indicators = [
    sample.includes("%PDF-"),
    /\/Type\s*\/Catalog/.test(sample),
    /\/Type\s*\/Page/.test(sample),
    /\bxref\b/.test(sample),
    /\bendobj\b/.test(sample),
    /\bstream\b[\s\S]{0,600}\bendstream\b/.test(sample),
    /\bstartxref\b/.test(sample),
  ].filter(Boolean).length;

  return indicators >= 2;
}

export function budgetText(value: string, maxChars = DEFAULT_MAX_CHARS): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const head = normalized.slice(0, Math.floor(maxChars * 0.7)).trim();
  const tail = normalized.slice(-Math.floor(maxChars * 0.25)).trim();

  return `${head}\n\n[content truncated for model budget]\n\n${tail}`.slice(0, maxChars);
}

export function mergeResumeSources(
  providedResumeText: string,
  extractedFileText: string,
  maxChars = 10000
): string {
  const provided = normalizeWhitespace(providedResumeText);
  const extracted = normalizeWhitespace(extractedFileText);

  if (!provided) return budgetText(extracted, maxChars);
  if (!extracted) return budgetText(provided, maxChars);

  if (provided.includes(extracted)) return budgetText(provided, maxChars);
  if (extracted.includes(provided)) return budgetText(extracted, maxChars);

  const overlapProbe = provided.slice(0, 500);
  if (overlapProbe && extracted.includes(overlapProbe)) {
    return budgetText(extracted, maxChars);
  }

  return budgetText(
    `PASTED RESUME TEXT\n${provided}\n\nEXTRACTED FILE TEXT\n${extracted}`,
    maxChars
  );
}
