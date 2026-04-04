"use client";

import { useState } from "react";
import { Loader2, Mic2 } from "lucide-react";

type QuestionItem = {
  question: string;
  answer_framework: string[];
};

interface MockInterviewSectionProps {
  resumeText: string;
  optimizedResume: string;
  jobDescription: string;
}

export default function MockInterviewSection({
  resumeText,
  optimizedResume,
  jobDescription,
}: MockInterviewSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[] | null>(null);

  async function generate() {
    setError(null);
    setQuestions(null);
    setLoading(true);
    try {
      const body = {
        resumeText: optimizedResume.trim().length >= 80 ? optimizedResume : resumeText,
        jobDescription: jobDescription.trim() || undefined,
      };
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setQuestions(data.questions as QuestionItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate questions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="interview-prep"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden scroll-mt-24"
    >
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-indigo-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Mic2 size={18} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Mock interview prep</h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              Six role-aware questions with answer frameworks grounded in your resume. Add a job description above for tighter alignment.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            "Generate questions"
          )}
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
        {questions && questions.length > 0 && (
          <ol className="space-y-5">
            {questions.map((q, i) => (
              <li key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  <span className="text-violet-600 mr-2">{i + 1}.</span>
                  {q.question}
                </p>
                {q.answer_framework.length > 0 && (
                  <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                    {q.answer_framework.map((line, j) => (
                      <li key={j}>{line}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
