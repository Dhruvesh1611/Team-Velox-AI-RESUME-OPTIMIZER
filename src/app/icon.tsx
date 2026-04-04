import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "linear-gradient(135deg, #4f46e5, #7c3aed 62%, #0f172a)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            color: "white",
            fontSize: 40,
            fontWeight: 800,
          }}
        >
          H
        </div>
        <div
          style={{
            position: "absolute",
            top: 15,
            right: 13,
            width: 16,
            height: 16,
            borderRadius: "9999px",
            border: "4px solid #c4b5fd",
            background: "rgba(248,250,252,0.95)",
          }}
        />
      </div>
    ),
    size
  );
}
