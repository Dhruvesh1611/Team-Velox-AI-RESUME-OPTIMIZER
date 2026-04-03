import type { ResumeAnalysis } from "../agents/analyzer.agent";
import type { ResumeReview } from "../agents/reviewer.agent";

export type PipelineRequestInput = {
  resumeText: string;
  file?: string;
};

export type OptimizeRequestInput = {
  resumeText: string;
  analysis: ResumeAnalysis;
};

export type PipelineResponse = {
  fileUrl: string | null;
  analysis: ResumeAnalysis;
  optimizedResume: string;
  review: ResumeReview;
};

export type ResumePipelineRecord = PipelineResponse & {
  id: string;
  resumeText: string;
  createdAt: string;
  updatedAt: string;
};
