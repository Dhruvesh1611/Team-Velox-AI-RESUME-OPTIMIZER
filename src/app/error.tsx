"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCcw, Sparkles } from "lucide-react";

import Navbar from "../components/landing/hero";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)",
            backgroundSize: "38px 38px",
          }}
        />
        <div className="absolute -top-24 left-[-4rem] h-72 w-72 rounded-full bg-amber-100 blur-3xl opacity-60" />
        <div className="absolute bottom-[-6rem] right-[-2rem] h-80 w-80 rounded-full bg-rose-100 blur-3xl opacity-60" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-16 sm:px-6">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <section className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <AlertTriangle size={12} />
                Runtime Error
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Something broke{" "}
                <span className="gradient-text">inside the workflow</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                An unexpected error interrupted this page. Try the request again, or return
                to one of the main product flows.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <RefreshCcw size={16} />
                  Try Again
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-200 hover:text-indigo-700 hover:shadow-sm"
                >
                  <ArrowLeft size={16} />
                  Back Home
                </Link>
              </div>
            </section>

            <aside className="animate-slide-up delay-100">
              <div className="glass-card rounded-[28px] p-6 shadow-xl shadow-slate-200/60">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                      Recovery Options
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
                      <Sparkles size={20} className="text-white" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Suggested Next Steps
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        <li>Retry this page with the `Try Again` action</li>
                        <li>Go back to `/` for the resume optimizer</li>
                        <li>Open `/builder` if you were trying to generate a new resume</li>
                      </ul>
                    </div>

                    {error.digest && (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                          Error Digest
                        </p>
                        <p className="mt-2 font-mono text-xs text-rose-800">{error.digest}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
