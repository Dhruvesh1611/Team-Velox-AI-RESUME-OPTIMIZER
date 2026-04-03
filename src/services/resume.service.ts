import { Types } from "mongoose";

import { analyzeResume } from "../agents/analyzer.agent";
import { optimizeResume } from "../agents/optimizer.agent";
import { reviewResume } from "../agents/reviewer.agent";
import { connectDB } from "../lib/db/mongodb";
import { ResumeRunModel } from "../models/resume-run.model";
import { uploadToCloudinary } from "./cloudinary.service";
import type {
  PipelineRequestInput,
  PipelineResponse,
  ResumePipelineRecord,
} from "../types/resume";

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

function mapResumeRun(document: {
  _id: Types.ObjectId | string;
  fileUrl?: string | null;
  resumeText: string;
  analysis: PipelineResponse["analysis"];
  optimizedResume: string;
  review: PipelineResponse["review"];
  createdAt: Date | string;
  updatedAt: Date | string;
}): ResumePipelineRecord {
  return {
    id: String(document._id),
    fileUrl: document.fileUrl ?? null,
    resumeText: document.resumeText,
    analysis: document.analysis,
    optimizedResume: document.optimizedResume,
    review: document.review,
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
    ? await uploadToCloudinary(input.file.trim())
    : null;

  const analysis = await analyzeResume(resumeText);
  const optimizedResume = await optimizeResume(resumeText, analysis);
  const review = await reviewResume(resumeText, optimizedResume);

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

  return documents.map(mapResumeRun);
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

  return document ? mapResumeRun(document) : null;
}
