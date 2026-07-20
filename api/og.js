// api/og.js
//
// Code-generated Open Graph image, served at /api/og as a Vercel Function.
// Nothing is stored on disk: @vercel/og renders the element tree below to a
// 1200x630 PNG on the fly (Satori under the hood).
//
// Written as a plain ESM `.js` function (no JSX) on purpose: Vercel's
// zero-config `/api` detection and its function bundler handle a `.js` module
// with no transpilation ambiguity, whereas a `.jsx` entry can be skipped or
// mis-compiled outside a framework. The `h()` helper builds exactly the
// { type, props } vnodes Satori consumes - the same shape JSX compiles to.
//
// Satori constraints honored here: flexbox layout only, hex colors only (no
// oklch/hsl), and the bundled default font (no external fonts). Every element
// with more than one child sets display:flex explicitly.
//
// Branded as a BeThere "check-in pass": product mark, the tagline, and a few
// boarding-pass-style detail fields. Strings mirror src/lib/site.js.
import { ImageResponse } from "@vercel/og";

const INK = "#2b2b2b";
const PAPER = "#f1f1f1";
const CARD = "#ffffff";
const MUTED = "#656565";
const MINT = "#3ecf8e";
const HAIRLINE = "#e2e2e2";

// Minimal hyperscript: returns the vnode shape (`{ type, props }`, with
// children collapsed to a single node when there is only one) that Satori and
// @vercel/og accept directly - i.e. what JSX would compile to.
const h = (type, style, ...children) => ({
  type,
  props: {
    style,
    ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}),
  },
});

// Boarding-pass detail column.
const field = (label, value, accent) =>
  h(
    "div",
    { display: "flex", flexDirection: "column", gap: "10px" },
    h("div", { fontSize: "18px", color: MUTED, letterSpacing: "3px" }, label),
    h("div", { fontSize: "28px", fontWeight: 700, color: accent || INK }, value)
  );

export default function handler() {
  return new ImageResponse(
    h(
      "div",
      {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: PAPER,
        padding: "56px",
        fontFamily: "sans-serif",
      },
      h(
        "div",
        {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: CARD,
          border: `2px solid ${INK}`,
          borderRadius: "28px",
          padding: "56px 64px",
        },
        // Header: product mark + pass label
        h(
          "div",
          { display: "flex", alignItems: "center", justifyContent: "space-between" },
          h(
            "div",
            { display: "flex", alignItems: "center", gap: "22px" },
            h(
              "div",
              {
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
              },
              "B/"
            ),
            h(
              "div",
              { display: "flex", flexDirection: "column" },
              h("div", { fontSize: "42px", fontWeight: 700, color: INK }, "BeThere"),
              h(
                "div",
                { fontSize: "20px", color: MUTED, letterSpacing: "4px" },
                "ATTENDANCE"
              )
            )
          ),
          h(
            "div",
            { display: "flex", alignItems: "center", gap: "14px" },
            h("div", {
              display: "flex",
              width: "14px",
              height: "14px",
              borderRadius: "999px",
              backgroundColor: MINT,
            }),
            h(
              "div",
              { fontSize: "22px", fontWeight: 700, color: INK, letterSpacing: "4px" },
              "CHECK-IN PASS"
            )
          )
        ),
        // Tagline
        h(
          "div",
          { display: "flex", flexDirection: "column" },
          h(
            "div",
            {
              fontSize: "108px",
              fontWeight: 700,
              color: INK,
              lineHeight: 1,
              letterSpacing: "-3px",
            },
            "Verified"
          ),
          h(
            "div",
            {
              fontSize: "108px",
              fontWeight: 700,
              color: INK,
              lineHeight: 1,
              letterSpacing: "-3px",
            },
            "live presence"
          )
        ),
        // Divider
        h("div", { display: "flex", width: "100%", height: "2px", backgroundColor: HAIRLINE }),
        // Boarding-pass detail fields
        h(
          "div",
          { display: "flex", justifyContent: "space-between" },
          field("METHOD", "Live face + venue code"),
          field("STACK", "React · Express · Postgres"),
          field("STATUS", "Verified", MINT)
        )
      )
    ),
    { width: 1200, height: 630 }
  );
}
