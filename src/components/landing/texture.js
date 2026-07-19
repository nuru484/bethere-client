// src/components/landing/texture.js
//
// The landing's signature surface: a fine halftone dot grid, applied as an
// inline style so the tile size stays exact regardless of Tailwind config.

export const dotsLight = {
  backgroundImage:
    "radial-gradient(circle, rgba(43, 43, 43, 0.10) 1px, transparent 1px)",
  backgroundSize: "7px 7px",
};

export const dotsDark = {
  backgroundImage:
    "radial-gradient(circle, rgba(250, 250, 250, 0.10) 1px, transparent 1px)",
  backgroundSize: "7px 7px",
};
