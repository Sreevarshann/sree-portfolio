import { ImageResponse } from "next/og";

export const alt = "Sree — AI, Data & Software Engineer in Boston";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const arms = Array.from({ length: 8 }, (_, i) => i * 45);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#08090c", color: "#eef1f6", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: "#8b95a7", letterSpacing: 4 }}>
          <span>SREEVARSHAN SATHIYAMURTHY</span>
          <span>42.3601° N, 71.0589° W</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <svg width="180" height="180" viewBox="0 0 100 100">
            {arms.map((a, i) => (
              <rect key={a} x={i % 2 ? 45.75 : 44.75} y={i % 2 ? 18 : 7} width={i % 2 ? 8.5 : 10.5} height={i % 2 ? 19 : 30} rx={i % 2 ? 4.25 : 5.25} fill={i % 2 ? "#a9c8ff" : "#4f8fff"} transform={`rotate(${a} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="6.5" fill="#ffffff" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>Sree.</div>
            <div style={{ fontSize: 40, color: "#c3cad6", marginTop: 18 }}>AI Engineer · Data Engineer · Software Engineer</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#a9c8ff" }}>Intelligent systems — from data to interface. Boston, MA.</div>
      </div>
    ),
    size,
  );
}
