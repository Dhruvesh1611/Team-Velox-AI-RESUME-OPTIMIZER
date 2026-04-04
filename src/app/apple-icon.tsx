import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 44,
          background: "linear-gradient(135deg, #4f46e5, #7c3aed 62%, #0f172a)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 16,
            borderRadius: 32,
            border: "2px solid rgba(255,255,255,0.28)",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            height: 180,
            color: "white",
            fontSize: 104,
            fontWeight: 800,
          }}
        >
          H
        </div>
        <div
          style={{
            position: "absolute",
            top: 42,
            right: 36,
            width: 38,
            height: 38,
            borderRadius: "9999px",
            border: "8px solid #c4b5fd",
            background: "rgba(248,250,252,0.95)",
          }}
        />
      </div>
    ),
    size
  );
}
