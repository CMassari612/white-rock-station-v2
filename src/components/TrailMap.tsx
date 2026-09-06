import { Bike, Tent } from 'lucide-react';

/**
 * Stylized map of the Armstrong Trail along the Allegheny River.
 * The trail line "redraws" itself on load. Stops run north (top) to
 * south (bottom): Kittanning → White Rock Station → Ford City → Leechburg.
 * Each leg between stops is labeled with its trail distance and an
 * estimated ride time. Colors come from the site's brand palette.
 *
 * Layout: town names sit just to the left/right of their dot; ride-leg
 * pills ride the center trail line. Dots zig-zag down the middle, names
 * fan out to whichever side keeps them clear of the line.
 */

type Stop = {
  name: string;
  /** marker position on the 900x660 viewBox */
  cx: number;
  cy: number;
  /** which side of the dot the name sits */
  side: 'left' | 'right';
  home?: boolean;
};

type Leg = {
  dist: string;
  time: string;
  /** pill position as a percentage of the map (centered on the trail line) */
  left: number;
  top: number;
};

const VIEW_W = 900;
const VIEW_H = 660;

// North (top) to south (bottom). Dots are spread evenly so no two crowd.
const STOPS: Stop[] = [
  { name: 'Kittanning', cx: 430, cy: 79, side: 'left' },
  { name: 'White Rock Station', cx: 500, cy: 231, side: 'right', home: true },
  { name: 'Ford City', cx: 400, cy: 383, side: 'left' },
  { name: 'Leechburg', cx: 480, cy: 581, side: 'right' },
];

// Ride legs between consecutive stops, pushed into the open left/right
// margin (alternating sides) so they never crowd the dots or town names.
const LEGS: Leg[] = [
  { dist: '5.7 mi', time: '39 min', left: 24, top: 24 }, // Kittanning → White Rock Station
  { dist: '5.7 mi', time: '39 min', left: 75, top: 46 }, // White Rock Station → Ford City
  { dist: '20.3 mi', time: '2 hr', left: 26, top: 73 }, // Ford City → Leechburg
];

// Faint connectors from each leg's trail midpoint to its pill in the margin.
const CONNECTORS = [
  { x1: 495, y1: 149, x2: 216, y2: 158 }, // → leg 1 pill
  { x1: 424, y1: 307, x2: 675, y2: 304 }, // → leg 2 pill
  { x1: 438, y1: 488, x2: 234, y2: 482 }, // → leg 3 pill
];

// Meandering route following the river valley, north (top) to south (bottom).
const TRAIL_PATH =
  'M 430 79 C 470 120, 540 175, 500 231 C 470 285, 360 330, 400 383 C 445 460, 430 520, 480 581';

export function TrailMap() {
  return (
    <div className="mt-12">
      <div className="text-center mb-6">
        <h3 className="mb-2">Find Your Way Along the Trail</h3>
        <p className="text-sm text-[var(--forest-green)]/70 max-w-xl mx-auto">
          Hop on the Armstrong Trail right from camp and ride north to Kittanning or
          south toward Ford City and Leechburg. Each label shows the trail distance and
          ride time between stops.
        </p>
      </div>

      <div className="relative w-full mx-auto" style={{ maxWidth: 880 }}>
        <div className="relative w-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Map of the Armstrong Trail along the Allegheny River. From north to south: Kittanning, White Rock Station, Ford City, and Leechburg, with bike distances between each."
          >
            {/* map backdrop */}
            <rect x="0" y="0" width={VIEW_W} height={VIEW_H} rx="16" fill="var(--off-white)" stroke="var(--sand-tan)" strokeWidth="2" />

            {/* soft land contours for texture */}
            <path d="M 0 150 C 220 120, 300 230, 520 200 C 700 175, 800 260, 900 230" fill="none" stroke="var(--sand-tan)" strokeWidth="2" opacity="0.5" />
            <path d="M 0 555 C 200 535, 340 610, 560 575 C 720 550, 820 610, 900 580" fill="none" stroke="var(--sand-tan)" strokeWidth="2" opacity="0.5" />

            {/* the Allegheny River — wide translucent blue band */}
            <path d={TRAIL_PATH} fill="none" stroke="var(--river-blue)" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" opacity="0.22" />

            {/* the Armstrong Trail — animated "redraw" along the river */}
            <path className="wrs-trail-line" d={TRAIL_PATH} pathLength={1000} fill="none" stroke="var(--warm-brown)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

            {/* faint connectors linking each margin pill back to its trail leg */}
            <g stroke="var(--river-blue)" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.4">
              {CONNECTORS.map((c, i) => (
                <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} />
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
    </div>
  );
}
