import { NextResponse } from "next/server";

import { optimizeResume } from "../../../agents/optimizer.agent";
import type { ResumeAnalysis } from "../../../agents/analyzer.agent";

type OptimizeRequestBody = {
  resumeText?: string;
  analysis?: ResumeAnalysis;
  jobDescription?: string;
};

export async function GET() {
  return NextResponse.json({
    message: "Optimizer endpoint is available.",
    method: "POST",
    requiredBody: {
      resumeText: "string",
      analysis: "ResumeAnalysis JSON",
      jobDescription: "string (optional)",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OptimizeRequestBody;
    const resumeText = body.resumeText?.trim();
    const analysis = body.analysis;

    if (!resumeText) {
      return NextResponse.json(
        { error: "resumeText is required." },
        { status: 400 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: "analysis is required." },
        { status: 400 }
      );
    }

    const optimizedResume = await optimizeResume(
      resumeText,
      analysis,
      body.jobDescription?.trim() || undefined
    );

    return NextResponse.json({ optimizedResume });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to optimize resume.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
