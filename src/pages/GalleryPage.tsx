import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface GalleryPageProps {
  title: string;
  description?: string;
  images: string[];
  /** page key to return to (e.g. 'lodging') */
  backTo: string;
  backLabel: string;
  onNavigate: (page: string) => void;
}

/**
 * Full photo gallery page (responsive grid). Reused for both the Cabin and
 * Campsite galleries. Structural CSS is inline because this project has no
 * live Tailwind compiler (see PhotoGallery.tsx note).
 */
export function GalleryPage({ title, description, images, backTo, backLabel, onNavigate }: GalleryPageProps) {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => onNavigate(backTo)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--river-blue)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: 24,
              fontSize: 16,
            }}
          >
            <ArrowLeft size={18} /> {backLabel}
          </button>

          <h1 style={{ marginBottom: 12 }}>{title}</h1>
          {description && (
            <p style={{ marginBottom: 40, maxWidth: 640, color: 'var(--forest-green)', opacity: 0.7 }}>
              {description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {images.map((src, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 3',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                  background: 'var(--sand-tan)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--forest-green)',
                    opacity: 0.4,
                  }}
                >
                  <ImageIcon size={30} />
                </span>
                <img
                  src={src}
                  alt={`${title} photo ${i + 1}`}
                  loading="lazy"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  style={{ position: 'relative', display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
