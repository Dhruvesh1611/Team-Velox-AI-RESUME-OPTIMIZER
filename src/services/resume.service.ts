import { Types } from "mongoose";

import { analyzeResume } from "../agents/analyzer.agent";
import { optimizeResume } from "../agents/optimizer.agent";
import { reviewResume, type ResumeReview } from "../agents/reviewer.agent";
import { connectDB } from "../lib/db/mongodb";
import { ResumeRunModel } from "../models/resume-run.model";
import { uploadResumeFileSafe } from "./cloudinary.service";
import type {
  PipelineRequestInput,
  PipelineResponse,
  ResumePipelineRecord,
} from "../types/resume";

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function normalizeReview(
  raw: Partial<ResumeReview> & Record<string, unknown>
): ResumeReview {
  const improvement = Math.max(
    0,
    Math.min(100, Math.round(Number(raw.improvement_score) || 0))
  );
  const placement = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        typeof raw.placement_readiness_score === "number"
          ? raw.placement_readiness_score
          : improvement
      )
    )
  );
  const finalSummary = String(raw.final_summary ?? "").trim();

  return {
    improvement_score: improvement,
    clarity_improvement: String(raw.clarity_improvement ?? "").trim(),
    impact_improvement: String(raw.impact_improvement ?? "").trim(),
    keyword_relevance: String(raw.keyword_relevance ?? "").trim(),
    final_summary: finalSummary,
    placement_readiness_score: placement,
    placement_summary:
      String(raw.placement_summary ?? finalSummary).trim() || finalSummary,
    role_strengths: Array.isArray(raw.role_strengths)
      ? raw.role_strengths.map(String).filter(Boolean)
      : [],
    role_gaps: Array.isArray(raw.role_gaps) ? raw.role_gaps.map(String).filter(Boolean) : [],
  };
}

function mapResumeRun(document: {
  _id: Types.ObjectId | string;
  fileUrl?: string | null;
  resumeText: string;
  jobDescription?: string | null;
  analysis: PipelineResponse["analysis"];
  optimizedResume: string;
  review: Partial<ResumeReview> & Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}): ResumePipelineRecord {
  return {
    id: String(document._id),
    fileUrl: document.fileUrl ?? null,
    resumeText: document.resumeText,
    jobDescription: document.jobDescription ?? null,
    analysis: document.analysis,
    optimizedResume: document.optimizedResume,
    review: normalizeReview(document.review),
    createdAt: new Date(document.createdAt).toISOString(),
    updatedAt: new Date(document.updatedAt).toISOString(),
  };
}

export async function runResumePipeline(
  input: PipelineRequestInput
): Promise<PipelineResponse> {
  const resumeText = input.resumeText.trim();

  if (!resumeText) {
    throw new Error("resumeText is required.");
  }

  const fileUrl = input.file?.trim()
    ? await uploadResumeFileSafe(input.file.trim())
    : null;

  const jobDescription = input.jobDescription?.trim() ?? "";

  const analysis = await analyzeResume(resumeText, jobDescription);
  const optimizedResume = await optimizeResume(resumeText, analysis, jobDescription);
  const review = await reviewResume(resumeText, optimizedResume, jobDescription);

  return {
    fileUrl,
    analysis,
    optimizedResume,
    review,
  };
}

export async function saveResumePipelineRun(
  input: PipelineRequestInput,
  output: PipelineResponse
): Promise<ResumePipelineRecord | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await connectDB();

  const created = await ResumeRunModel.create({
    fileUrl: output.fileUrl,
    resumeText: input.resumeText.trim(),
    jobDescription: input.jobDescription?.trim() || undefined,
    analysis: output.analysis,
    optimizedResume: output.optimizedResume,
    review: output.review,
  });

  return mapResumeRun(created.toObject());
}

export async function listResumePipelineRuns(
  limit = 10
): Promise<ResumePipelineRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await connectDB();

  const normalizedLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const documents = await ResumeRunModel.find({})
    .sort({ createdAt: -1 })
    .limit(normalizedLimit)
    .lean();

  return documents.map((doc) =>
    mapResumeRun(doc as Parameters<typeof mapResumeRun>[0])
  );
}

export async function getResumePipelineRunById(
  id: string
): Promise<ResumePipelineRecord | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid pipeline run id.");
  }

  await connectDB();

  const document = await ResumeRunModel.findById(id).lean();

  return document
    ? mapResumeRun(document as Parameters<typeof mapResumeRun>[0])
    : null;
}

