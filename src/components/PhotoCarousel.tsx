import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoCarouselProps {
  images: string[];
  intervalMs?: number;
  className?: string;
  alt?: string;
}

// Lightweight auto-advancing image carousel (no external deps). Fades between
// photos, pauses on hover, and has prev/next arrows + dot indicators.
export function PhotoCarousel({ images, intervalMs = 4500, className = '', alt = 'Photo' }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (n: number) => setIndex((p) => (n + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (paused || images.length < 2) return;
    const t = setInterval(() => setIndex((p) => (p + 1) % images.length), intervalMs);
    return () => clearInterval(t);
  }, [paused, images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div
      className={`relative rounded-lg overflow-hidden shadow-xl aspect-[4/3] bg-[var(--sand-tan)]/30 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${alt} ${i + 1}`}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            aria-label="Previous photo"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition"
          >
            <ChevronLeft size={18} className="text-[var(--forest-green)]" />
          </button>
          <button
            aria-label="Next photo"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition"
          >
            <ChevronRight size={18} className="text-[var(--forest-green)]" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
