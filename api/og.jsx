// api/og.jsx
//
// Code-generated Open Graph image, served at /api/og as a Vercel Edge
// Function. Nothing is stored on disk: @vercel/og renders the JSX below to a
// 1200x630 PNG on the fly (Satori under the hood).
//
// Satori constraints honored here: flexbox layout only, hex colors only (no
// oklch/hsl), and the bundled default font (no external fonts). Every element
// with more than one child sets display:flex explicitly.
//
// Branded as a BeThere "check-in pass": product mark, the tagline, and a few
// boarding-pass-style detail fields. Strings mirror src/lib/site.js.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const INK = "#2b2b2b";
const PAPER = "#f1f1f1";
const CARD = "#ffffff";
const MUTED = "#656565";
const MINT = "#3ecf8e";
const HAIRLINE = "#e2e2e2";

// Boarding-pass detail column. Kept inline (not a component) so the file has
// no prop-types surface and stays a single self-contained edge handler.
const field = (label, value, accent) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
    <div style={{ fontSize: "18px", color: MUTED, letterSpacing: "3px" }}>
      {label}
    </div>
    <div style={{ fontSize: "28px", fontWeight: 700, color: accent || INK }}>
      {value}
    </div>
  </div>
);

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: PAPER,
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: CARD,
            border: `2px solid ${INK}`,
            borderRadius: "28px",
            padding: "56px 64px",
          }}
        >
          {/* Header: product mark + pass label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "76px",
                  height: "76px",
                  borderRadius: "18px",
                  backgroundColor: INK,
                  color: CARD,
                  fontSize: "34px",
                  fontWeight: 700,
                }}
              >
                B/
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "42px", fontWeight: 700, color: INK }}>
                  BeThere
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    color: MUTED,
                    letterSpacing: "4px",
                  }}
                >
                  ATTENDANCE
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  display: "flex",
                  width: "14px",
                  height: "14px",
                  borderRadius: "999px",
                  backgroundColor: MINT,
                }}
              />
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: "4px",
                }}
              >
                CHECK-IN PASS
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "108px",
                fontWeight: 700,
                color: INK,
                lineHeight: 1,
                letterSpacing: "-3px",
              }}
            >
              Verified
            </div>
            <div
              style={{
                fontSize: "108px",
                fontWeight: 700,
                color: INK,
                lineHeight: 1,
                letterSpacing: "-3px",
              }}
            >
              live presence
            </div>
          </div>

          {/* Divider */}
          <div
            style={{ display: "flex", width: "100%", height: "2px", backgroundColor: HAIRLINE }}
          />

          {/* Boarding-pass detail fields */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {field("METHOD", "Live face + venue code")}
            {field("STACK", "React · Express · Postgres")}
            {field("STATUS", "Verified", MINT)}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
