// White Rock Station logo — vector recreation of the property sign: two
// feathered canoe paddles (teardrop blade + fanned feather + banded shaft +
// tapered handle) framing the wordmark. Single-color; set `color`.

const PADDLE =
  'M6,20 C6,12 16,8.5 38,9 C66,9.5 86,13 92,16.5 L245,18 C253,18.6 257,19.3 259,20 C257,20.7 253,21.4 245,22 L92,23.5 C86,27 66,30.5 38,31 C16,31.5 6,28 6,20 Z ' +
  'M16,19.4 L88,19.4 L88,20.6 L16,20.6 Z ' +
  'M18,19.6 L12,15 L13.2,15.7 L16.9,19.7 L13.2,24.3 L12,25 L18,20.4 Z ' +
  'M24,19.6 L18,15 L19.2,15.7 L22.9,19.7 L19.2,24.3 L18,25 L24,20.4 Z ' +
  'M30,19.5 L21,13.8 L22.4,14.6 L28.6,19.7 L22.4,25.4 L21,26.2 L30,20.5 Z ' +
  'M44,19.5 L35,13.8 L36.4,14.6 L42.6,19.7 L36.4,25.4 L35,26.2 L44,20.5 Z ' +
  'M58,19.5 L49,13.8 L50.4,14.6 L56.6,19.7 L50.4,25.4 L49,26.2 L58,20.5 Z ' +
  'M72,19.5 L63,13.8 L64.4,14.6 L70.6,19.7 L64.4,25.4 L63,26.2 L72,20.5 Z ' +
  'M98,16.8 L98,23.2 L99.6,23.2 L99.6,16.8 Z M106,16.8 L106,23.2 L107.6,23.2 L107.6,16.8 Z';

interface Props {
  height?: number;
  color?: string;
  showSubtitle?: boolean;
  className?: string;
}

export function WrsLogo({ height = 52, color = 'currentColor', showSubtitle = true, className }: Props) {
  return (
    <svg
      className={className}
      height={height}
      viewBox="138 24 404 120"
      role="img"
      aria-label="White Rock Station"
      style={{ display: 'block', width: 'auto' }}
    >
      <g transform="translate(133,18)" fill={color}>
        <path fillRule="evenodd" transform="scale(1.5)" d={PADDLE} />
        <path fillRule="evenodd" transform="rotate(180 207 66) scale(1.5)" d={PADDLE} />
        <text x="207" y="64" textAnchor="middle" fontFamily="'Segoe UI',Arial,sans-serif" fontSize="26" fontWeight="800" letterSpacing="2">WHITE ROCK STATION</text>
        {showSubtitle && (
          <text x="207" y="82" textAnchor="middle" fontFamily="'Segoe UI',Arial,sans-serif" fontSize="10.5" fontWeight="600" letterSpacing="3">RIVERFRONT RESORT &amp; MARINA</text>
        )}
      </g>
    </svg>
  );
}
