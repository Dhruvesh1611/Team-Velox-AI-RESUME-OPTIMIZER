import { NextResponse } from "next/server";

import { analyzeResume } from "../../../agents/analyzer.agent";

type AnalyzeRequestBody = {
  resumeText?: string;
  jobDescription?: string;
};

export async function GET() {
  return NextResponse.json({
    message: "Analyzer endpoint is available.",
    method: "POST",
    requiredBody: {
      resumeText: "string",
      jobDescription: "string (optional)",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;
    const resumeText = body.resumeText?.trim();

    if (!resumeText) {
      return NextResponse.json(
        { error: "resumeText is required." },
        { status: 400 }
      );
    }

    const analysis = await analyzeResume(
      resumeText,
      body.jobDescription?.trim() || undefined
    );
    return NextResponse.json({ analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze resume.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
