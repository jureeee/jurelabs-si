# Solid SVG cursor icons

This directory contains standalone SVG shape candidates for the website's
custom animated cursor.

## Contents

- `stars/`: 9 star, sparkle, and starburst cursor shapes.
- `hearts/`: 2 heart cursor shapes.
- `preview.png`: contact sheet for visual review only; do not use it as the
  runtime cursor asset.
- `cursor-solid-svg-icons.zip`: packaged copy of the 11 SVG source files.

## Asset contract

- Each cursor icon stays in its own SVG file.
- Every SVG uses a `0 0 128 128` viewBox and has a transparent background.
- Closed shapes are solid fills rather than hollow outlines.
- The shapes use `currentColor` where possible so inline SVG usage can inherit
  the cursor theme color.
- Do not merge the set into a sprite sheet or convert it back to raster unless
  that is explicitly requested.

## Integration note for Claude

Treat these SVGs as source candidates for the existing custom cursor system.
When wiring one into the app, preserve its aspect ratio and use it either as an
inline SVG or as a CSS mask. The files in this directory are assets only; their
presence does not mean a cursor variant is already enabled in the UI.
