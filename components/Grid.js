'use client';

import { COLORS } from '@/lib/geometry';

/**
 * The source document draws every table cell as its own rectangle stroked at
 * 0.5pt. A CSS border cannot reproduce that: Chrome rounds border widths up to
 * a whole device pixel, so `0.5pt` prints as 0.75pt, and `border-collapse`
 * still emits a separate fill for each edge. Drawing the grid as SVG gives real
 * PDF strokes at exactly 0.5pt, one rectangle per cell, like the original.
 *
 * The table itself keeps transparent borders so cell sizes are unchanged; this
 * sits underneath it and paints the lines and the header fill.
 */
export default function Grid({
  colW,
  headH,
  rowH,
  rowSpans,
  headFill = COLORS.fill,
  headStroke = COLORS.green,
  stroke = COLORS.grid,
}) {
  const xs = [0];
  colW.forEach((w) => xs.push(xs[xs.length - 1] + w));
  const width = xs[xs.length - 1];
  const height = headH + rowH.reduce((a, b) => a + b, 0);

  const rects = [];
  colW.forEach((w, i) => {
    rects.push({ x: xs[i], y: 0, w, h: headH, fill: headFill, stroke: headStroke });
  });
  let y = headH;
  rowH.forEach((h, r) => {
    // Summary rows merge columns in the source, so they get fewer, wider cells.
    const spans = (rowSpans && rowSpans[r]) || colW.map(() => 1);
    let col = 0;
    spans.forEach((span) => {
      rects.push({ x: xs[col], y, w: xs[col + span] - xs[col], h, fill: 'none', stroke });
      col += span;
    });
    y += h;
  });

  return (
    <svg
      width={`${width}pt`}
      height={`${height}pt`}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, shapeRendering: 'geometricPrecision' }}
      aria-hidden="true"
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          fill={r.fill}
          stroke={r.stroke}
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

/**
 * The settlement block on page 1: the first two rows merge columns 2..5 and one
 * row carries the green fill.
 */
export function SettleGrid({ colW, rowH, rows, greenRow }) {
  const xs = [0];
  colW.forEach((w) => xs.push(xs[xs.length - 1] + w));
  const width = xs[xs.length - 1];
  const height = rowH * rows.length;

  const rects = [];
  rows.forEach((spans, r) => {
    const y = r * rowH;
    let col = 0;
    spans.forEach((span) => {
      const x = xs[col];
      const w = xs[col + span] - x;
      if (r === greenRow) {
        rects.push({ x, y, w, h: rowH, fill: COLORS.fill, stroke: COLORS.green });
      } else {
        rects.push({ x, y, w, h: rowH, fill: 'none', stroke: COLORS.grid });
      }
      col += span;
    });
  });

  return (
    <svg
      width={`${width}pt`}
      height={`${height}pt`}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, shapeRendering: 'geometricPrecision' }}
      aria-hidden="true"
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          fill={r.fill}
          stroke={r.stroke}
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}
