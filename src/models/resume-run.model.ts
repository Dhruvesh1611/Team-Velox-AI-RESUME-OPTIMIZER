import { Schema, model, models } from "mongoose";

const ResumeRunSchema = new Schema(
  {
    fileUrl: {
      type: String,
      default: null,
      trim: true,
    },
    resumeText: {
      type: String,
      required: true,
      trim: true,
    },
    jobDescription: {
      type: String,
      trim: true,
      default: null,
    },
    analysis: {
      skills: {
        type: [String],
        default: [],
      },
      weak_points: {
        type: [String],
        default: [],
      },
      missing_metrics: {
        type: [String],
        default: [],
      },
      keyword_gaps: {
        type: [String],
        default: [],
      },
      structure_issues: {
        type: [String],
        default: [],
      },
    },
    optimizedResume: {
      type: String,
      required: true,
      trim: true,
    },
    review: {
      improvement_score: {
        type: Number,
        required: true,
      },
      clarity_improvement: {
        type: String,
        required: true,
        trim: true,
      },
      impact_improvement: {
        type: String,
        required: true,
        trim: true,
      },
      keyword_relevance: {
        type: String,
        required: true,
        trim: true,
      },
      final_summary: {
        type: String,
        required: true,
        trim: true,
      },
      placement_readiness_score: {
        type: Number,
        default: null,
      },
      placement_summary: {
        type: String,
        default: "",
        trim: true,
      },
      role_strengths: {
        type: [String],
        default: [],
      },
      role_gaps: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ResumeRunModel =
  models.ResumeRun || model("ResumeRun", ResumeRunSchema);
