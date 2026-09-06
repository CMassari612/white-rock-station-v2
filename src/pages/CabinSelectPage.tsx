import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Bed, Bath } from 'lucide-react';
import { api, LodgingType } from '../lib/api';
import { cabinGalleryImages } from '../lib/galleryImages';

interface CabinSelectPageProps {
  lodgingType?: LodgingType; // 'small-cabin' | 'large-cabin'
  onNavigate: (page: string, lodgingType?: LodgingType, unitId?: string) => void;
}

interface UnitInfo {
  unitId: string;
  name: string;
  photoUrl?: string;
  description?: string;
}

const CONFIG: Record<string, { unitType: 'small_cabin' | 'large_cabin'; price: number; title: string; guests: number; beds: number; baths: number }> = {
  'small-cabin': { unitType: 'small_cabin', price: 125, title: 'Our Small Cabins', guests: 2, beds: 1, baths: 1 },
  'large-cabin': { unitType: 'large_cabin', price: 250, title: 'Our Large Cabins', guests: 4, beds: 2, baths: 1 },
};

const DEFAULT_DESCRIPTION = 'Cozy riverside cabin steps from the Allegheny River and Armstrong Trail.';

function CabinCard({
  unit, cfg, onOpen,
}: {
  unit: UnitInfo;
  cfg: (typeof CONFIG)[string];
  onOpen: () => void;
}) {
  const photos = useMemo(
    () => (unit.photoUrl ? [unit.photoUrl, ...cabinGalleryImages] : cabinGalleryImages),
    [unit.photoUrl]
  );
  const [idx, setIdx] = useState(0);
  const go = (e: React.MouseEvent, dir: number) => {
    e.stopPropagation();
    setIdx(i => (i + dir + photos.length) % photos.length);
  };

  return (
    <div
      onClick={onOpen}
      style={{ cursor: 'pointer', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--sand-tan)' }}>
        <img src={photos[idx]} alt={unit.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {photos.length > 1 && (
          <>
            <button onClick={(e) => go(e, -1)} aria-label="Previous photo" style={arrowStyle('left')}><ChevronLeft size={18} /></button>
            <button onClick={(e) => go(e, 1)} aria-label="Next photo" style={arrowStyle('right')}><ChevronRight size={18} /></button>
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {photos.map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: i === idx ? '#fff' : 'rgba(255,255,255,0.55)' }} />
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h4 style={{ margin: 0 }}>{unit.name}</h4>
          <span style={{ color: 'var(--river-blue)', fontWeight: 700 }}>${cfg.price}<span style={{ fontWeight: 400, fontSize: 13 }}>/night</span></span>
        </div>
        <div style={{ display: 'flex', gap: 14, margin: '8px 0', fontSize: 13, color: 'var(--forest-green)', opacity: 0.8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Users size={15} /> {cfg.guests}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Bed size={15} /> {cfg.beds} bed</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Bath size={15} /> {cfg.baths} bath</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--forest-green)', opacity: 0.7, margin: '0 0 12px' }}>{unit.description || DEFAULT_DESCRIPTION}</p>
        <span style={{ color: 'var(--river-blue)', fontWeight: 600, fontSize: 14 }}>View cabin &amp; dates →</span>
      </div>
    </div>
  );
}

export function CabinSelectPage({ lodgingType, onNavigate }: CabinSelectPageProps) {
  const cfg = CONFIG[lodgingType || 'small-cabin'] || CONFIG['small-cabin'];
  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const today = new Date();
        const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const end = new Date(today); end.setDate(end.getDate() + 30);
        const res = await api.getUnitAvailability({ unitType: cfg.unitType, start: ymd(today), end: ymd(end) });
        if (!cancelled) setUnits(res.units || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load cabins.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cfg.unitType]);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4" style={{ background: 'var(--off-white)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 24 }}>
        <button onClick={() => onNavigate('lodging')} style={{ background: 'none', border: 'none', color: 'var(--river-blue)', cursor: 'pointer', padding: 0, marginBottom: 16, fontSize: 15 }}>
          ← Back to Lodging
        </button>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>{cfg.title}</h1>
        <p style={{ textAlign: 'center', color: 'var(--forest-green)', opacity: 0.7, marginBottom: 32 }}>
          Browse our cabins and tap one to see photos, details, and live availability. ${cfg.price}/night.
        </p>

        {loading && <p style={{ textAlign: 'center', opacity: 0.7 }}>Loading cabins…</p>}
        {error && <p style={{ textAlign: 'center', color: '#b3261e' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {units.map(u => (
              <CabinCard key={u.unitId} unit={u} cfg={cfg} onOpen={() => onNavigate('cabin-detail', lodgingType, u.unitId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', [side]: 8,
    width: 30, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.9)', color: 'var(--forest-green)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  } as React.CSSProperties;
}
