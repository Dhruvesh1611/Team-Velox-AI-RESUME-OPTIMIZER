import Link from "next/link";
import { ArrowLeft, Compass, FileSearch, Sparkles } from "lucide-react";

import Navbar from "../components/landing/hero";

export default function NotFound() {
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
        <div className="absolute -top-24 left-[-4rem] h-72 w-72 rounded-full bg-violet-100 blur-3xl opacity-60" />
        <div className="absolute bottom-[-6rem] right-[-2rem] h-80 w-80 rounded-full bg-indigo-100 blur-3xl opacity-70" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-16 sm:px-6">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <section className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <FileSearch size={12} />
                Error 404
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                The page you requested is{" "}
                <span className="gradient-text">not in this pipeline</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                The link may be outdated, the route may have changed, or the page never
                existed. The core HireLens flows are still available below.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <ArrowLeft size={16} />
                  Back Home
                </Link>
                <Link
                  href="/builder"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-200 hover:text-indigo-700 hover:shadow-sm"
                >
                  <Sparkles size={16} />
                  Open Builder
                </Link>
              </div>
            </section>

            <aside className="animate-slide-up delay-100">
              <div className="glass-card rounded-[28px] p-6 shadow-xl shadow-slate-200/60">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-700">
                      Route Recovery
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
                      <Compass size={20} className="text-white" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Available Paths
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        <li>`/` for the multi-agent optimizer</li>
                        <li>`/builder` for resume generation from portfolio data</li>
                        <li>`/contact` for project and team links</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                        Tip
                      </p>
                      <p className="mt-2 text-sm leading-6 text-indigo-800">
                        If you reached this page from an internal link, the route is stale and
                        should be updated.
                      </p>
                    </div>
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
