import { NextResponse } from "next/server";

import { generateMockInterview } from "../../../services/mock-interview.service";

const MAX_RESUME = 24_000;
const MAX_JOB = 12_000;

export async function GET() {
  return NextResponse.json({
    message: "Mock interview prep endpoint.",
    method: "POST",
    body: {
      resumeText: "string (required)",
      jobDescription: "string (optional)",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      resumeText?: string;
      jobDescription?: string;
    };

    const resumeText = body.resumeText?.trim() ?? "";
    if (resumeText.length < 80) {
      return NextResponse.json(
        { error: "resumeText must be at least 80 characters." },
        { status: 400 }
      );
    }

    if (resumeText.length > MAX_RESUME) {
      return NextResponse.json(
        { error: `resumeText exceeds maximum length (${MAX_RESUME}).` },
        { status: 400 }
      );
    }

    const jobDescription = body.jobDescription?.trim();
    if (jobDescription && jobDescription.length > MAX_JOB) {
      return NextResponse.json(
        { error: `jobDescription exceeds maximum length (${MAX_JOB}).` },
        { status: 400 }
      );
    }

    const questions = await generateMockInterview({
      resumeText,
      jobDescription: jobDescription || undefined,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Could not generate interview questions. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Mock interview generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
