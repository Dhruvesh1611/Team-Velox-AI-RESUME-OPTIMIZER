import { NextResponse } from "next/server";

import {
  getResumePipelineRunById,
  listResumePipelineRuns,
  runResumePipeline,
  saveResumePipelineRun,
} from "../../../services/resume.service";
import { extractTextFromUpload } from "../../../services/file-extraction.service";
import {
  looksLikePdfBinaryText,
  mergeResumeSources,
} from "../../../services/prompt-budget.service";
import type { PipelineRequestInput } from "../../../types/resume";

const MAX_JOB_DESCRIPTION_CHARS = 12_000;

function isUserInputError(message: string): boolean {
  return [
    "Paste resume text or upload a resume file.",
    "Could not extract readable text from this PDF.",
    "The submitted content looks like raw PDF binary data.",
    "The uploaded document could not be converted into readable text.",
    "Unsupported upload format. Expected a base64 data URL.",
    "Unsupported file type:",
    "exceeds maximum length",
  ].some((candidate) => message.includes(candidate));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const limitParam = searchParams.get("limit");

    if (id) {
      const run = await getResumePipelineRunById(id);

      if (!run) {
        return NextResponse.json(
          { error: "Pipeline run not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({ run });
    }

    const limit = limitParam ? Number(limitParam) : 10;
    const runs = await listResumePipelineRuns(Number.isFinite(limit) ? limit : 10);

    return NextResponse.json({
      message: "Resume pipeline API is available.",
      method: "POST",
      requiredBody: {
        resumeText: "string",
        file: "base64 data URL (optional)",
        fileName: "string (optional)",
        jobDescription: "string (optional, target role / JD)",
      },
      runs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch pipeline runs.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PipelineRequestInput>;
    const providedResumeText = body.resumeText?.trim() ?? "";
    const extractedFileText = body.file?.trim()
      ? await extractTextFromUpload(body.file.trim(), body.fileName)
      : "";
    const resumeText = mergeResumeSources(providedResumeText, extractedFileText);

    if (!resumeText) {
      return NextResponse.json(
        { error: "Paste resume text or upload a resume file." },
        { status: 400 }
      );
    }

    const jobRaw = body.jobDescription?.trim() ?? "";
    if (jobRaw.length > MAX_JOB_DESCRIPTION_CHARS) {
      return NextResponse.json(
        {
          error: `jobDescription exceeds maximum length (${MAX_JOB_DESCRIPTION_CHARS} characters).`,
        },
        { status: 400 }
      );
    }

    if (looksLikePdfBinaryText(resumeText)) {
      return NextResponse.json(
        {
          error:
            "The submitted content looks like raw PDF binary data. Upload the PDF file itself or paste readable resume text.",
        },
        { status: 400 }
      );
    }

    const input: PipelineRequestInput = {
      resumeText,
      file: body.file,
      fileName: body.fileName,
      jobDescription: jobRaw || undefined,
    };
    const result = await runResumePipeline(input);
    const savedRun = await saveResumePipelineRun(input, result);

    return NextResponse.json({
      ...result,
      runId: savedRun?.id ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run resume pipeline.";

    return NextResponse.json(
      { error: message },
      { status: isUserInputError(message) ? 400 : 500 }
    );
  }
}
