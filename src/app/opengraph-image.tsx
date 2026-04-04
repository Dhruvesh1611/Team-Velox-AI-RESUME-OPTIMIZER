import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #eef2ff 0%, #f8fafc 45%, #ede9fe 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: "9999px",
            background: "rgba(99, 102, 241, 0.18)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: "9999px",
            background: "rgba(124, 58, 237, 0.15)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 92,
                height: 92,
                borderRadius: 28,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white",
                fontSize: 46,
                fontWeight: 800,
                boxShadow: "0 18px 40px rgba(79, 70, 229, 0.25)",
              }}
            >
              H
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 46,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                HireLens
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: "#475569",
                }}
              >
                AI Resume Optimizer and Portfolio Resume Builder
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 860,
            }}
          >
            <div
              style={{
                fontSize: 70,
                lineHeight: 1.05,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Analyze, enrich, optimize, and review resumes with AI.
            </div>
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                color: "#4338ca",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              <span>ATS optimization</span>
              <span>Portfolio-based resume building</span>
              <span>Mock interview prep</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
