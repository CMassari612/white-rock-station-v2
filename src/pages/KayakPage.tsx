import { useEffect, useState } from 'react';
import { getUnit, Unit } from '../lib/cottages';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

export function KayakPage({ onNavigate }: Props) {
  const [unit, setUnit] = useState<Unit | null>(null);
  useEffect(() => { getUnit('kayak-rentals').then(setUnit).catch(() => setUnit(null)); }, []);

  const hero = unit?.photos?.[0] ?? '/images/scenery/Scenery 18.jpg';

  return (
    <div className="wrs">
      <section className="wrs-hero" style={{ minHeight: '56vh' }}>
        <div className="wrs-hero__bg" style={{ backgroundImage: `url(${encodeURI(hero)})` }} />
        <div className="wrs-hero__scrim" />
        <div className="wrs-container wrs-hero__inner">
          <p className="wrs-eyebrow" style={{ color: 'var(--wrs-tan)' }}>On the Water</p>
          <h1 className="wrs-h1">Kayak Rentals</h1>
          <p className="wrs-hero__sub">{unit?.description ?? 'Kayak rentals are coming soon to White Rock Station.'}</p>
          <span className="wrs-chip" style={{ background: 'var(--wrs-tan)', color: 'var(--wrs-green)', fontWeight: 700 }}>Coming Soon</span>
        </div>
      </section>

      <section className="wrs-section">
        <div className="wrs-container wrs-center">
          <h2 className="wrs-h2">Paddle the Allegheny</h2>
          <p className="wrs-lead">
            We're getting our fleet ready. Soon you'll be able to reserve and pay online, sign your rental waiver,
            and launch right from the property.
          </p>
          <div className="wrs-features" style={{ marginTop: 26, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="wrs-feature"><div className="wrs-feature__icon">1</div><h3 className="wrs-h3">Reserve online</h3><p className="wrs-muted">Book your kayak by the hour or day.</p></div>
            <div className="wrs-feature"><div className="wrs-feature__icon">2</div><h3 className="wrs-h3">Sign your waiver</h3><p className="wrs-muted">Quick electronic waiver before you launch.</p></div>
            <div className="wrs-feature"><div className="wrs-feature__icon">3</div><h3 className="wrs-h3">Hit the water</h3><p className="wrs-muted">Launch right from White Rock Station.</p></div>
          </div>
          <div style={{ marginTop: 30 }}>
            <button className="wrs-btn wrs-btn-outline" onClick={() => onNavigate('contact')}>Ask us about kayaks</button>
          </div>
        </div>
      </section>
    </div>
  );
}
