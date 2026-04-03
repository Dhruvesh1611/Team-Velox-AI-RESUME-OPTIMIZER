import { NextResponse } from "next/server";

import {
  getResumePipelineRunById,
  listResumePipelineRuns,
  runResumePipeline,
  saveResumePipelineRun,
} from "../../../services/resume.service";
import type { PipelineRequestInput } from "../../../types/resume";

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
        file: "base64 string (optional)",
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
    const resumeText = body.resumeText?.trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "resumeText is required." },
        { status: 400 }
      );
    }

    const input: PipelineRequestInput = {
      resumeText,
      file: body.file,
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

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
