// src/components/landing/PixelGlyph.jsx
//
// Abstract pixel-art motifs drawn as a CSS grid of squares - the landing's
// illustration language. Each glyph is a matrix of palette indexes
// (0 = empty, 1..4 = mint shades, light to deep).

import PropTypes from "prop-types";

const SHADES = ["transparent", "#dcf5e9", "#b9edd4", "#8ce3b8", "#3ecf8e"];

const GLYPHS = {
  // Descending stair: enrolment, step by step.
  stair: [
    [4, 2, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 3, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 3, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 2, 4, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 2, 3, 2, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 3, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 2, 4, 2, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 3, 2, 1],
  ],
  // Concentric diamond: the geofence ring around a point.
  diamond: [
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
    [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 1, 0],
    [0, 1, 2, 3, 4, 4, 3, 2, 1, 0],
    [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
    [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  ],
  // Narrowing funnel: many claims in, verified presence out.
  funnel: [
    [1, 2, 3, 4, 4, 4, 4, 3, 2, 1],
    [0, 1, 2, 3, 4, 4, 3, 2, 1, 0],
    [0, 0, 2, 3, 4, 4, 3, 2, 0, 0],
    [0, 0, 0, 3, 4, 4, 3, 0, 0, 0],
    [0, 0, 0, 2, 4, 4, 2, 0, 0, 0],
    [0, 0, 0, 1, 3, 3, 1, 0, 0, 0],
    [0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 0, 0, 0, 0],
  ],
  // Checker: the session calendar, filled and empty days.
  checker: [
    [3, 0, 2, 0, 4, 0, 2, 0, 3, 0],
    [0, 2, 0, 3, 0, 2, 0, 4, 0, 1],
    [2, 0, 4, 0, 2, 0, 3, 0, 2, 0],
    [0, 3, 0, 2, 0, 4, 0, 2, 0, 3],
    [4, 0, 2, 0, 3, 0, 2, 0, 4, 0],
    [0, 2, 0, 4, 0, 2, 0, 3, 0, 2],
    [3, 0, 2, 0, 2, 0, 4, 0, 1, 0],
    [0, 4, 0, 3, 0, 3, 0, 2, 0, 2],
  ],
  // Rising bars: attendance rolling up into reports.
  bars: [
    [0, 0, 0, 0, 0, 0, 0, 0, 4, 4],
    [0, 0, 0, 0, 0, 0, 3, 0, 4, 4],
    [0, 0, 0, 0, 3, 0, 3, 0, 4, 4],
    [0, 0, 0, 0, 3, 0, 3, 0, 4, 4],
    [0, 0, 2, 0, 3, 0, 3, 0, 4, 4],
    [0, 0, 2, 0, 3, 0, 3, 0, 4, 4],
    [1, 0, 2, 0, 3, 0, 3, 0, 4, 4],
    [1, 0, 2, 0, 3, 0, 3, 0, 4, 4],
  ],
};

export function PixelGlyph({ name, className = "" }) {
  const matrix = GLYPHS[name] ?? GLYPHS.diamond;
  const cols = matrix[0].length;

  return (
    <div
      aria-hidden="true"
      className={`grid w-full ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {matrix.flat().map((v, i) => (
        <div
          key={i}
          className="aspect-square"
          style={{ backgroundColor: SHADES[v] }}
        />
      ))}
    </div>
  );
}

PixelGlyph.propTypes = {
  name: PropTypes.oneOf(Object.keys(GLYPHS)).isRequired,
  className: PropTypes.string,
};
