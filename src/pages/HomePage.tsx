import { useEffect, useState } from 'react';
import { Home, Tent, Bike, Waves } from 'lucide-react';
import { getUnits, dollars, Unit } from '../lib/cottages';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

export function HomePage({ onNavigate }: Props) {
  const [cottages, setCottages] = useState<Unit[]>([]);

  useEffect(() => {
    getUnits().then(u => setCottages(u.filter(x => x.unitType === 'cottage').slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="wrs">
      {/* Hero */}
      <section className="wrs-hero">
        <div className="wrs-hero__bg" style={{ backgroundImage: 'url(/images/scenery/Scenery%2003.jpg)' }} />
        <div className="wrs-hero__scrim" />
        <div className="wrs-container wrs-hero__inner">
          <p className="wrs-eyebrow" style={{ color: '#f8f6f2' }}>Kittanning, Pennsylvania</p>
          <h1 className="wrs-h1" style={{ fontSize: 'clamp(46px, 8vw, 88px)', letterSpacing: '-0.02em', marginBottom: 8, color: '#f8f6f2' }}>White Rock Station</h1>
          <p style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: '#f8f6f2', fontWeight: 700, margin: '0 0 16px' }}>Riverfront Cottages &amp; Camping</p>
          <p className="wrs-hero__sub">
            Cozy cottages, primitive camping, and direct access to the Armstrong Trail — book directly with White Rock Station.
          </p>
          <div className="wrs-hero__cta">
            <button className="wrs-btn wrs-btn-primary" onClick={() => onNavigate('cottages')}>Explore Cottages</button>
            <button className="wrs-btn wrs-btn-ghost" onClick={() => onNavigate('trail')}>Armstrong Trail</button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="wrs-section wrs-section--tight">
        <div className="wrs-container">
          <div className="wrs-features">
            <div className="wrs-feature"><div className="wrs-feature__icon"><Home size={24} strokeWidth={1.75} /></div><h3 className="wrs-h3">Riverfront Cottages</h3><p className="wrs-muted">Fully-equipped cottages with full kitchens and river views.</p></div>
            <div className="wrs-feature"><div className="wrs-feature__icon"><Bike size={24} strokeWidth={1.75} /></div><h3 className="wrs-h3">Armstrong Trail</h3><p className="wrs-muted">Step right onto one of PA's favorite rail-trails.</p></div>
            <div className="wrs-feature"><div className="wrs-feature__icon"><Waves size={24} strokeWidth={1.75} /></div><h3 className="wrs-h3">River Access</h3><p className="wrs-muted">Direct access to the Allegheny right from your cottage.</p></div>
          </div>
        </div>
      </section>

      {/* Featured cottages */}
      <section className="wrs-section" style={{ background: '#fff' }}>
        <div className="wrs-container">
          <div className="wrs-grouphead">
            <div>
              <p className="wrs-eyebrow">Stay With Us</p>
              <h2 className="wrs-h2">Featured Cottages</h2>
            </div>
            <button className="wrs-btn wrs-btn-outline" onClick={() => onNavigate('cottages')}>View all</button>
          </div>
          <div className="wrs-grid">
            {cottages.map(unit => (
              <div key={unit.id} className="wrs-card wrs-card--link" onClick={() => onNavigate('cottage-detail', unit.slug)}>
                <div className="wrs-card__media">
                  {unit.location && <span className="wrs-badge">{unit.location}</span>}
                  {unit.photos?.[0] && <img src={encodeURI(unit.photos[0])} alt={unit.name} loading="lazy" />}
                </div>
                <div className="wrs-card__body">
                  <h3 className="wrs-card__title">{unit.name}</h3>
                  <div className="wrs-card__meta">{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bedroom`} · Sleeps {unit.maxGuests}</div>
                  <div className="wrs-card__foot">
                    <span className="wrs-price">{dollars(unit.weekdayPriceCents ?? 0)} <small>/ night</small></span>
                    <span className="wrs-btn wrs-btn-outline" style={{ padding: '8px 16px', fontSize: 14 }}>View &amp; Book</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="wrs-section" style={{ background: 'var(--wrs-green)', color: '#fff' }}>
        <div className="wrs-container wrs-center">
          <h2 className="wrs-h2" style={{ color: '#fff' }}>Come stay on the river</h2>
          <p className="wrs-hero__sub" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Book directly for the best rate — no third-party fees.
          </p>
          <button className="wrs-btn wrs-btn-primary" onClick={() => onNavigate('cottages')}>Book Your Stay</button>
        </div>
      </section>
    </div>
  );
}
