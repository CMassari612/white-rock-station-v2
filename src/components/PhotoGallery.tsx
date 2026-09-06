import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  /** auto-advance interval in ms */
  interval?: number;
  /** if provided, clicking the center photo runs this (e.g. open full gallery) */
  onOpen?: () => void;
}

/**
 * Coverflow-style photo carousel: the center photo is enlarged while the
 * photos on either side are smaller and dimmed, so three show at once.
 *
 * NOTE: all structural CSS (sizing, positioning, transforms) is applied via
 * inline styles, NOT Tailwind utility classes. This project has no live
 * Tailwind compiler (it ships a pre-built src/index.css), so newly-added
 * utility classes generate no CSS — inline styles are guaranteed to work.
 */
export function PhotoGallery({ images, interval = 4000, onOpen }: PhotoGalleryProps) {
  const count = images.length;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (dir: number) => setCurrent((c) => (c + dir + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = window.setInterval(() => setCurrent((c) => (c + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [count, paused, interval]);

  if (count === 0) return null;

  // Each photo's position relative to the centered one (wrapping by shortest path).
  const place = (i: number) => {
    let rel = i - current;
    if (rel > count / 2) rel -= count;
    if (rel < -count / 2) rel += count;
    const dir = rel < 0 ? -1 : 1;
    if (rel === 0) return { shift: 0, scale: 1, z: 30, opacity: 1, visible: true };
    if (Math.abs(rel) === 1) return { shift: dir * 62, scale: 0.74, z: 20, opacity: 0.55, visible: true };
    return { shift: dir * 118, scale: 0.6, z: 10, opacity: 0, visible: false };
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', maxWidth: 880, margin: '0 auto' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* viewport — explicit height via aspect-ratio so it can never collapse */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '5 / 2', overflow: 'hidden' }}>
        {images.map((src, i) => {
          const p = place(i);
          const isCenter = p.z === 30;
          return (
            <button
              key={i}
              type="button"
              onClick={() => (isCenter && onOpen ? onOpen() : setCurrent(i))}
              aria-label={isCenter ? (onOpen ? 'Open full gallery' : `Photo ${i + 1}`) : `View photo ${i + 1}`}
              tabIndex={p.visible ? 0 : -1}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '52%',
                aspectRatio: '4 / 3',
                transform: `translate(calc(-50% + ${p.shift}%), -50%) scale(${p.scale})`,
                opacity: p.opacity,
                zIndex: p.z,
                transition: 'transform 500ms ease, opacity 500ms ease',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                background: 'var(--sand-tan)',
                padding: 0,
                border: 'none',
                cursor: isCenter && !onOpen ? 'default' : 'pointer',
                pointerEvents: p.visible ? 'auto' : 'none',
              }}
            >
              {/* placeholder shown if the image fails to load (keeps the slide sized) */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--forest-green)',
                  opacity: 0.45,
                }}
              >
                <ImageIcon size={30} />
              </span>
              <img
                src={src}
                alt={`Gallery image ${i + 1}`}
                loading="lazy"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                style={{ position: 'relative', display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!isCenter && <span style={{ position: 'absolute', inset: 0, background: 'rgba(47,79,67,0.25)' }} />}
            </button>
          );
        })}

        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" style={navStyle('left')}>
              <ChevronLeft size={22} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" style={navStyle('right')}>
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* dot indicators */}
      {count > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to photo ${i + 1}`}
              style={{
                height: 10,
                width: i === current ? 24 : 10,
                borderRadius: 9999,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: i === current ? 'var(--river-blue)' : 'var(--sand-tan)',
                transition: 'width 300ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function navStyle(side: 'left' | 'right'): CSSProperties {
  const style: CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 9999,
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.92)',
    color: 'var(--forest-green)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };
  if (side === 'left') style.left = 8;
  else style.right = 8;
  return style;
}
