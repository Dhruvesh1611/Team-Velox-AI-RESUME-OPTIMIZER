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
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ResumeRunModel =
  models.ResumeRun || model("ResumeRun", ResumeRunSchema);
