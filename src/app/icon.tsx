import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: the SS monogram. */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#08090c", borderRadius: 16, color: "#eef1f6", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ lineHeight: 1 }}>SS</span>
          <span style={{ width: 14, height: 2, borderRadius: 1, background: "#4f8fff", marginTop: 4 }} />
        </div>
      </div>
    ),
    size,
  );
}
