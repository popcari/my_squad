'use client';

import { useId } from 'react';
import { useTranslation } from 'react-i18next';

interface UniformVisualProps {
  shirtColor: string;
  pantColor: string;
  numberColor: string;
  number?: string;
  className?: string;
}

/**
 * SVG rendering of a football kit (shirt + pants) with a jersey number.
 * Uses smooth bezier paths, linear + radial gradients for depth, and drop-shadow
 * filters for a polished look. Gradient IDs are scoped via `useId` so multiple
 * instances on the same page render correctly.
 */
export function UniformVisual({
  shirtColor,
  pantColor,
  numberColor,
  number = '10',
  className,
}: UniformVisualProps) {
  const { t } = useTranslation();
  const uid = useId().replace(/:/g, '');

  const shirtLight = shade(shirtColor, 24);
  const shirtDark = shade(shirtColor, -24);
  const shirtDeep = shade(shirtColor, -48);
  const pantLight = shade(pantColor, 22);
  const pantDark = shade(pantColor, -24);

  const shirtGradId = `${uid}-shirt-grad`;
  const shirtShineId = `${uid}-shirt-shine`;
  const pantGradId = `${uid}-pant-grad`;
  const pantShineId = `${uid}-pant-shine`;
  const shadowId = `${uid}-shadow`;

  // Closed jersey path (body + both sleeves + V-neck indent)
  const shirtPath = `
    M 8 82
    C 6 58 24 40 46 34
    L 72 24
    C 84 19 97 22 108 30
    L 120 72
    L 132 30
    C 143 22 156 19 168 24
    L 194 34
    C 216 40 234 58 232 82
    L 226 120
    C 220 128 208 125 200 110
    L 200 196
    C 200 208 192 214 180 214
    L 60 214
    C 48 214 40 208 40 196
    L 40 110
    C 32 125 20 128 14 120
    Z
  `
    .replace(/\s+/g, ' ')
    .trim();

  // Shorts path (waistband + two legs + crotch curve) — ~85% width of shirt
  const shortsPath = `
    M 49 232
    L 191 232
    C 199 232 205 238 205 246
    L 200 332
    C 198 342 190 346 183 346
    L 146 346
    C 139 346 135 342 134 332
    L 127 262
    C 125 254 122 252 120 252
    C 118 252 115 254 113 262
    L 106 332
    C 105 342 101 346 94 346
    L 57 346
    C 49 346 42 342 40 332
    L 35 246
    C 35 238 41 232 49 232
    Z
  `
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <svg
      viewBox="0 0 240 380"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={t('a11y.uniformPreview')}
    >
      <defs>
        <linearGradient id={shirtGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shirtLight} />
          <stop offset="0.55" stopColor={shirtColor} />
          <stop offset="1" stopColor={shirtDark} />
        </linearGradient>
        <radialGradient
          id={shirtShineId}
          cx="0.32"
          cy="0.24"
          r="0.6"
          fx="0.3"
          fy="0.22"
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={pantGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pantLight} />
          <stop offset="0.55" stopColor={pantColor} />
          <stop offset="1" stopColor={pantDark} />
        </linearGradient>
        <radialGradient
          id={pantShineId}
          cx="0.32"
          cy="0.2"
          r="0.55"
          fx="0.3"
          fy="0.18"
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="5"
            floodColor="#000"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* Inner collar: a pill behind the V-neck so the V appears cut out */}
      <rect
        x="100"
        y="22"
        width="40"
        height="22"
        rx="3"
        ry="3"
        fill={shirtDeep}
      />

      {/* Shirt base with linear gradient + shadow */}
      <path
        d={shirtPath}
        fill={`url(#${shirtGradId})`}
        filter={`url(#${shadowId})`}
      />
      {/* Shirt highlight overlay (shine) */}
      <path d={shirtPath} fill={`url(#${shirtShineId})`} />

      {/* Stitched hem on the shirt bottom */}
      <path
        d="M 44 200 L 196 200"
        stroke={shirtDeep}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.55"
      />

      {/* Jersey number */}
      <text
        x="120"
        y="158"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily='"Arial Black", Impact, "Helvetica Neue", sans-serif'
        fontWeight={900}
        fontSize="82"
        fill={numberColor}
        style={{ letterSpacing: '-4px' }}
        paintOrder="stroke"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="2"
      >
        {number}
      </text>

      {/* Shorts base */}
      <path
        d={shortsPath}
        fill={`url(#${pantGradId})`}
        filter={`url(#${shadowId})`}
      />
      {/* Shorts highlight */}
      <path d={shortsPath} fill={`url(#${pantShineId})`} />

      {/* Waistband accent line */}
      <path
        d="M 44 248 L 196 248"
        stroke={pantDark}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/** Darken or lighten a hex color by `percent` (-100..100). */
function shade(hex: string, percent: number): string {
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  const amt = Math.round((percent / 100) * 255);
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(parsed.r + amt);
  const g = clamp(parsed.g + amt);
  const b = clamp(parsed.b + amt);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(hex);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}
