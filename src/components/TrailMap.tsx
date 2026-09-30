import { Bike, Tent } from 'lucide-react';

/**
 * Stylized map of the Armstrong Trails along the Allegheny River.
 * The trail line "redraws" itself on load. Stops run NORTH (top) to
 * SOUTH (bottom): East Brady → Kittanning → Ford City → White Rock Station →
 * Leechburg. White Rock Station sits near the south end (Schenley/Gilpin),
 * just north of Leechburg. Each leg is labeled with its trail distance and an
 * estimated ride time.
 *
 * NOTE: distances marked "~" are approximate and pending confirmation.
 */

type Stop = {
  name: string;
  cx: number;
  cy: number;
  side: 'left' | 'right';
  home?: boolean;
};

type Leg = {
  dist: string;
  time: string;
  left: number;
  top: number;
};

const VIEW_W = 900;
const VIEW_H = 660;

// North (top) → south (bottom).
const STOPS: Stop[] = [
  { name: 'East Brady', cx: 430, cy: 70, side: 'left' },
  { name: 'Kittanning', cx: 490, cy: 210, side: 'right' },
  { name: 'Ford City', cx: 400, cy: 360, side: 'left' },
  { name: 'White Rock Station', cx: 500, cy: 500, side: 'right', home: true },
  { name: 'Leechburg', cx: 440, cy: 600, side: 'left' },
];

// Ride legs between consecutive stops (north → south).
// East Brady↔Kittanning and Kittanning↔Ford City are exact figures from the
// official Armstrong Trails mileage chart. The two legs south of Ford City
// (to White Rock Station and Leechburg) are off that chart, so they stay "~".
const LEGS: Leg[] = [
  { dist: '24.8 mi', time: '~2 hr 30', left: 24, top: 21 },   // East Brady → Kittanning (chart)
  { dist: '4.2 mi', time: '~25 min', left: 75, top: 43 },     // Kittanning → Ford City (chart)
  { dist: '~15 mi', time: '~1 hr 30', left: 24, top: 65 },    // Ford City → White Rock Station (est.)
  { dist: '~6 mi', time: '~35 min', left: 74, top: 83 },      // White Rock Station → Leechburg (est.)
];

// Each distance pill links to BOTH towns its leg spans with a dimmed, dotted
// line + arrowhead, so it's clear what the distance is "from" and "to".
// Lines are trimmed to emerge from the pill edge and stop just shy of each dot.
function trimLine(px: number, py: number, sx: number, sy: number, padStart = 46, padEnd = 16) {
  const dx = sx - px;
  const dy = sy - py;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return { x1: px + ux * padStart, y1: py + uy * padStart, x2: sx - ux * padEnd, y2: sy - uy * padEnd };
}

// Build two connectors per leg: pill → town A and pill → town B.
const CONNECTORS = LEGS.flatMap((leg, i) => {
  const px = (leg.left / 100) * VIEW_W;
  const py = (leg.top / 100) * VIEW_H;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return [
    trimLine(px, py, a.cx, a.cy, 46, a.home ? 22 : 16),
    trimLine(px, py, b.cx, b.cy, 46, b.home ? 22 : 16),
  ];
});

// Meandering route following the river valley, north (top) to south (bottom).
const TRAIL_PATH =
  'M 430 70 C 470 120, 520 165, 490 210 C 455 265, 360 315, 400 360 C 445 415, 540 455, 500 500 C 478 540, 430 570, 440 600';

export function TrailMap() {
  return (
    <div className="mt-12">
      <div className="text-center mb-6">
        <h3 className="mb-2">Find Your Way Along the Trail</h3>
        <p className="text-sm text-[var(--forest-green)]/70 max-w-xl mx-auto">
          Hop on the Armstrong Trails right from camp — ride south to Leechburg, or north
          through Ford City and Kittanning and all the way to East Brady. Each label shows
          the trail distance and ride time between stops.
        </p>
      </div>

      <div className="relative w-full mx-auto" style={{ maxWidth: 880 }}>
        <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Map of the Armstrong Trails along the Allegheny River. From north to south: East Brady, Kittanning, Ford City, White Rock Station, and Leechburg, with approximate bike distances between each."
          >
            <defs>
              {/* small arrowhead pointing at each town */}
              <marker id="wrs-conn-arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 Z" fill="var(--river-blue)" opacity="0.55" />
              </marker>
            </defs>

            {/* map backdrop */}
            <rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="16" fill="var(--off-white)" stroke="var(--sand-tan)" strokeWidth="2" />

            {/* soft land contours for texture */}
            <path d="M 0 150 C 220 120, 300 230, 520 200 C 700 175, 800 260, 900 230" fill="none" stroke="var(--sand-tan)" strokeWidth="2" opacity="0.5" />
            <path d="M 0 555 C 200 535, 340 610, 560 575 C 720 550, 820 610, 900 580" fill="none" stroke="var(--sand-tan)" strokeWidth="2" opacity="0.5" />

            {/* the Allegheny River — wide translucent blue band */}
            <path d={TRAIL_PATH} fill="none" stroke="var(--river-blue)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" opacity="0.22" />

            {/* the Armstrong Trails — animated "redraw" along the river */}
            <path className="wrs-trail-line" d={TRAIL_PATH} pathLength={1000} fill="none" stroke="var(--warm-brown)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

            {/* dotted connectors — each pill points to the two towns it spans */}
            <g stroke="var(--river-blue)" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" opacity="0.45">
              {CONNECTORS.map((c, i) => (
                <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} markerEnd="url(#wrs-conn-arrow)" />
              ))}
            </g>

            {/* north arrow */}
            <g transform="translate(852 50)" opacity="0.7">
              <path d="M 0 -16 L 7 8 L 0 2 L -7 8 Z" fill="var(--forest-green)" />
              <text x="0" y="26" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--forest-green)">N</text>
            </g>

            {/* markers */}
            {STOPS.map((stop, i) => (
              <g key={stop.name} className="wrs-map-pin" style={{ animationDelay: `${1.9 + i * 0.25}s` }}>
                {stop.home ? (
                  <>
                    <circle cx={stop.cx} cy={stop.cy} r="14" fill="var(--forest-green)" stroke="var(--off-white)" strokeWidth="3" />
                    <circle cx={stop.cx} cy={stop.cy} r="20" fill="none" stroke="var(--forest-green)" strokeWidth="2" opacity="0.4" />
                  </>
                ) : (
                  <circle cx={stop.cx} cy={stop.cy} r="10" fill="var(--river-blue)" stroke="var(--off-white)" strokeWidth="3" />
                )}
              </g>
            ))}
          </svg>

          {/* town names — just beside each dot */}
          {STOPS.map((stop, i) => {
            const isLeft = stop.side === 'left';
            return (
              <div
                key={stop.name}
                className="wrs-map-label absolute w-max max-w-28"
                style={{
                  left: `${(stop.cx / VIEW_W) * 100}%`,
                  top: `${(stop.cy / VIEW_H) * 100}%`,
                  transform: isLeft
                    ? 'translate(calc(-100% - 12px), -50%)'
                    : `translate(${stop.home ? 30 : 12}px, -50%)`,
                  animationDelay: `${2.1 + i * 0.25}s`,
                }}
              >
                <div className={`rounded-md border bg-[var(--off-white)] px-2.5 py-1.5 text-center shadow-sm ${stop.home ? 'border-[var(--forest-green)]' : 'border-[var(--sand-tan)]'}`}>
                  <div className="flex items-center justify-center gap-1 text-sm font-medium leading-tight text-[var(--forest-green)]">
                    {stop.home && <Tent size={14} className="text-[var(--forest-green)]" />}
                    {stop.name}
                  </div>
                  {stop.home && <div className="text-xs text-[var(--forest-green)]/60">Your basecamp</div>}
                </div>
              </div>
            );
          })}

          {/* ride-leg pills on the center trail line */}
          {LEGS.map((leg, i) => (
            <div
              key={i}
              className="wrs-map-label absolute flex min-w-[6rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--river-blue)] px-4 py-1 text-xs font-medium text-white shadow-sm"
              style={{ left: `${leg.left}%`, top: `${leg.top}%`, animationDelay: `${2.7 + i * 0.25}s` }}
            >
              <Bike size={12} />
              {leg.dist} · {leg.time}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm mt-5">
        <a
          href="https://armstrongtrails.org/wp-content/uploads/2025/03/Final-Trail-mapJune-2024-1-scaled.jpg"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--river-blue)] underline hover:opacity-80"
        >
          View the full official Armstrong Trails map →
        </a>
      </p>
    </div>
  );
}
