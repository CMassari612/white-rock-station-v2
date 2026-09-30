import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  images: string[];
  startIndex?: number;
  onClose: () => void;
  title?: string;
}

// Full-screen photo gallery overlay with prev/next, keyboard nav, counter,
// and a thumbnail strip. Click the backdrop or press Esc to close.
export function Lightbox({ images, startIndex = 0, onClose, title }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);

  const go = useCallback(
    (n: number) => setIndex((p) => (n + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, go, onClose]);

  if (images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', color: '#fff' }}>
        <span style={{ fontWeight: 600 }}>{title ? `${title} · ` : ''}{index + 1} / {images.length}</span>
        <button aria-label="Close gallery" onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.15)', border: 0, color: '#fff', width: 40, height: 40, borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={22} />
        </button>
      </div>

      {/* Main image */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', minHeight: 0 }}
        onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button aria-label="Previous photo" onClick={() => go(index - 1)}
            style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.15)', border: 0, color: '#fff', width: 48, height: 48, borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={26} />
          </button>
        )}
        <img src={encodeURI(images[index])} alt={`Photo ${index + 1}`}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        {images.length > 1 && (
          <button aria-label="Next photo" onClick={() => go(index + 1)}
            style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.15)', border: 0, color: '#fff', width: 48, height: 48, borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', gap: 8, padding: '14px 20px', overflowX: 'auto', justifyContent: 'center' }}>
          {images.map((src, i) => (
            <img key={src} src={encodeURI(src)} alt={`Thumbnail ${i + 1}`} onClick={() => setIndex(i)}
              style={{ width: 84, height: 60, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', flex: '0 0 auto', opacity: i === index ? 1 : 0.55, outline: i === index ? '2px solid #fff' : 'none' }} />
          ))}
        </div>
      )}
    </div>
  );
}
