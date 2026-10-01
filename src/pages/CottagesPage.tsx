import { useEffect, useState } from 'react';
import { getUnits, dollars, Unit } from '../lib/cottages';
import { Ed } from '../lib/siteText';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

// Group by size so the two one-bedroom cottages (Allegheny Shore + Boatwatch)
// show together, with the studios in their own section. Grouping by bedroom
// count keeps this correct without any database changes.
const GROUP_DEFS: { name: string; blurb: string; match: (u: Unit) => boolean }[] = [
  {
    name: 'One-Bedroom Cottages',
    blurb: 'Our larger one-bedroom cottages, offering more space and beautiful views just steps from the Allegheny River.',
    match: (u) => (u.bedrooms || 0) >= 1,
  },
  {
    name: 'Riverview Village',
    blurb: 'Trailfront studios with river views, steps from the Armstrong Trails.',
    match: (u) => (u.bedrooms || 0) === 0,
  },
];

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

  const groups = GROUP_DEFS.map(g => ({ name: g.name, blurb: g.blurb, items: units.filter(g.match) })).filter(g => g.items.length);

  return (
    <div className="wrs">
      <section className="wrs-section wrs-section--tight" style={{ background: 'var(--wrs-green)', color: '#fff' }}>
        <div className="wrs-container" style={{ paddingTop: 40 }}>
          <Ed as="p" id="cottages.hero.eyebrow" className="wrs-eyebrow" style={{ color: 'var(--wrs-tan)' }}>Stay With Us</Ed>
          <Ed as="h1" id="cottages.hero.title" className="wrs-h1" style={{ color: '#fff' }}>Riverside Cottages</Ed>
          <Ed as="p" id="cottages.hero.sub" className="wrs-hero__sub" style={{ marginBottom: 0 }}>Refined riverfront cabins designed for a relaxed stay.</Ed>
        </div>
      </section>

      <section className="wrs-section">
        <div className="wrs-container">
          {loading && <Ed as="p" id="cottages.loading" className="wrs-lead">Loading cottages…</Ed>}
          {error && <div className="wrs-note">{error}</div>}

          {!loading && !error && groups.map(group => (
            <div key={group.name} style={{ marginBottom: 48 }}>
              <div className="wrs-grouphead">
                <div>
                  <h2 className="wrs-h2" style={{ marginBottom: 4 }}>{group.name}</h2>
                  <p className="wrs-muted" style={{ margin: 0 }}>{group.blurb}</p>
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
                        {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bedroom`} · <Ed as="span" id="cottages.card.sleeps">Sleeps</Ed> {unit.maxGuests}
                      </div>
                      <p className="wrs-card__meta" style={{ marginTop: 2 }}>{unit.shortDescription}</p>
                      <div className="wrs-card__foot">
                        <span className="wrs-price">{dollars(unit.weekdayPriceCents ?? 0)} <Ed as="small" id="cottages.card.pernight">/ night</Ed></span>
                        <span className="wrs-btn wrs-btn-outline" style={{ padding: '8px 16px', fontSize: 14 }}><Ed as="span" id="cottages.card.viewbook">View &amp; Book</Ed></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loading && !error && (
            <div className="wrs-note" style={{ marginTop: 8 }}>
              <Ed as="span" id="cottages.note.p1">More cottages are joining Riverview Village soon. Check back or </Ed><button className="wrs-linklike" onClick={() => onNavigate('contact')} style={{ background: 'none', border: 'none', color: 'var(--wrs-blue)', cursor: 'pointer', textDecoration: 'underline', font: 'inherit', padding: 0 }}><Ed as="span" id="cottages.note.contact">contact us</Ed></button><Ed as="span" id="cottages.note.p2"> to ask about availability.</Ed>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
