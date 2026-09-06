import { useEffect, useState } from 'react';
import { getUnits, dollars, Unit } from '../lib/cottages';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

const GROUP_ORDER = ['Allegheny Shore', 'Riverview Village'];
const GROUP_BLURB: Record<string, string> = {
  'Allegheny Shore': 'Our riverfront cottage, right on the water.',
  'Riverview Village': 'Trailfront cottages and studios with river views, steps from the Armstrong Trail.',
};

export function CottagesPage({ onNavigate }: Props) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUnits()
      .then(u => setUnits(u.filter(x => x.unitType === 'cottage')))
      .catch(() => setError('We could not load the cottages right now.'))
      .finally(() => setLoading(false));
  }, []);

  const groups = GROUP_ORDER.map(g => ({ name: g, items: units.filter(u => u.group === g) })).filter(g => g.items.length);

  return (
    <div className="wrs">
      <section className="wrs-section wrs-section--tight" style={{ background: 'var(--wrs-green)', color: '#fff' }}>
        <div className="wrs-container" style={{ paddingTop: 40 }}>
          <p className="wrs-eyebrow" style={{ color: 'var(--wrs-tan)' }}>Stay With Us</p>
          <h1 className="wrs-h1" style={{ color: '#fff' }}>Riverside Cottages</h1>
          <p className="wrs-hero__sub" style={{ marginBottom: 0 }}>
            Comfortable, fully-equipped cottages along the Allegheny River and the Armstrong Trail — book directly with us.
          </p>
        </div>
      </section>

      <section className="wrs-section">
        <div className="wrs-container">
          {loading && <p className="wrs-lead">Loading cottages…</p>}
          {error && <div className="wrs-note">{error}</div>}

          {!loading && !error && groups.map(group => (
            <div key={group.name} style={{ marginBottom: 48 }}>
              <div className="wrs-grouphead">
                <div>
                  <h2 className="wrs-h2" style={{ marginBottom: 4 }}>{group.name}</h2>
                  <p className="wrs-muted" style={{ margin: 0 }}>{GROUP_BLURB[group.name]}</p>
                </div>
              </div>

              <div className="wrs-grid">
                {group.items.map(unit => (
                  <div key={unit.id} className="wrs-card wrs-card--link" onClick={() => onNavigate('cottage-detail', unit.slug)}>
                    <div className="wrs-card__media">
                      {unit.location && <span className="wrs-badge">{unit.location}</span>}
                      {unit.photos?.[0] && <img src={encodeURI(unit.photos[0])} alt={unit.name} loading="lazy" />}
                    </div>
                    <div className="wrs-card__body">
                      <h3 className="wrs-card__title">{unit.name}</h3>
                      <div className="wrs-card__meta">
                        {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bedroom`} · Sleeps {unit.maxGuests}
                      </div>
                      <p className="wrs-card__meta" style={{ marginTop: 2 }}>{unit.shortDescription}</p>
                      <div className="wrs-card__foot">
                        <span className="wrs-price">{dollars(unit.weekdayPriceCents ?? 0)} <small>/ night</small></span>
                        <span className="wrs-btn wrs-btn-outline" style={{ padding: '8px 16px', fontSize: 14 }}>View &amp; Book</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loading && !error && (
            <div className="wrs-note" style={{ marginTop: 8 }}>
              More cottages are joining Riverview Village soon. Check back or <button className="wrs-linklike" onClick={() => onNavigate('contact')} style={{ background: 'none', border: 'none', color: 'var(--wrs-blue)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit', padding: 0 }}>contact us</button> to ask about availability.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
