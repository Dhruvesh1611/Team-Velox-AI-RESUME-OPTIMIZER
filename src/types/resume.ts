import type { ResumeAnalysis } from "../agents/analyzer.agent";
import type { ResumeReview } from "../agents/reviewer.agent";

export type PipelineRequestInput = {
  resumeText: string;
  file?: string;
  fileName?: string;
  /** Optional target role / JD for job-specific keyword gaps and tailoring */
  jobDescription?: string;
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
  /** Stored when user provided a target JD */
  jobDescription?: string | null;
  createdAt: string;
  updatedAt: string;
};


