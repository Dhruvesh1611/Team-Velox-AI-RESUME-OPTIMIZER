export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-950">
      <main className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
              Resume Optimizer API
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Multi-agent resume pipeline is running.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600">
              Use <code className="rounded bg-zinc-100 px-2 py-1">POST /api/pipeline</code> with
              <code className="rounded bg-zinc-100 px-2 py-1">resumeText</code> and optional
              <code className="rounded bg-zinc-100 px-2 py-1">file</code> base64 input to upload,
              analyze, optimize, and review a resume in one request.
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-6 text-sm text-zinc-100">
            <pre className="overflow-x-auto whitespace-pre-wrap">{`POST /api/pipeline
Content-Type: application/json

{
  "resumeText": "Your resume text here",
  "file": "data:application/pdf;base64,...."
}`}</pre>
          </div>
        </div>
      </main>
    </div>
  );
}
