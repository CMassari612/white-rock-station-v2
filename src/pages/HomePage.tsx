import { useEffect, useState } from 'react';
import { Home, Bike, Waves } from 'lucide-react';
import { getUnits, dollars, Unit } from '../lib/cottages';
import { Ed } from '../lib/siteText';

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
          <Ed as="p" id="home.hero.eyebrow" className="wrs-eyebrow" style={{ color: '#f8f6f2' }}>Gilpin, Pennsylvania</Ed>
          <Ed as="h1" id="home.hero.title" className="wrs-h1" style={{ fontSize: 'clamp(46px, 8vw, 88px)', letterSpacing: '-0.02em', marginBottom: 8, color: '#f8f6f2' }}>White Rock Station</Ed>
          <Ed as="p" id="home.hero.tagline" style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: '#f8f6f2', fontWeight: 700, margin: '0 0 16px' }}>Riverfront Cottages &amp; Camping</Ed>
          <Ed as="p" id="home.hero.sub" className="wrs-hero__sub">
            Cozy cottages, primitive camping, and direct access to the Armstrong Trails — book directly with White Rock Station.
          </Ed>
          <div className="wrs-hero__cta">
            <button className="wrs-btn wrs-btn-primary" onClick={() => onNavigate('cottages')}><Ed as="span" id="home.hero.cta1">Explore Cottages</Ed></button>
            <button className="wrs-btn wrs-btn-ghost" onClick={() => onNavigate('trail')}><Ed as="span" id="home.hero.cta2">Armstrong Trails</Ed></button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="wrs-section wrs-section--tight">
        <div className="wrs-container">
          <div className="wrs-features">
            <div className="wrs-feature"><div className="wrs-feature__icon"><Home size={24} strokeWidth={1.75} /></div><Ed as="h3" id="home.vp1.title" className="wrs-h3">Riverfront Cottages</Ed><Ed as="p" id="home.vp1.text" className="wrs-muted">Fully-equipped cottages with full kitchens and river views.</Ed></div>
            <div className="wrs-feature"><div className="wrs-feature__icon"><Bike size={24} strokeWidth={1.75} /></div><Ed as="h3" id="home.vp2.title" className="wrs-h3">Armstrong Trails</Ed><Ed as="p" id="home.vp2.text" className="wrs-muted">Step right onto one of PA's favorite rail-trails.</Ed></div>
            <div className="wrs-feature"><div className="wrs-feature__icon"><Waves size={24} strokeWidth={1.75} /></div><Ed as="h3" id="home.vp3.title" className="wrs-h3">River Access</Ed><Ed as="p" id="home.vp3.text" className="wrs-muted">Direct access to the Allegheny right from your cottage.</Ed></div>
          </div>
        </div>
      </section>

      {/* Featured cottages */}
      <section className="wrs-section" style={{ background: '#fff' }}>
        <div className="wrs-container">
          <div className="wrs-grouphead">
            <div>
              <Ed as="p" id="home.featured.eyebrow" className="wrs-eyebrow">Stay With Us</Ed>
              <Ed as="h2" id="home.featured.title" className="wrs-h2">Featured Cottages</Ed>
            </div>
            <button className="wrs-btn wrs-btn-outline" onClick={() => onNavigate('cottages')}><Ed as="span" id="home.featured.viewall">View all</Ed></button>
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

      {/* Johnetta Supply / camp store */}
      <section className="wrs-section" style={{ background: 'var(--wrs-tan, #efe9dd)' }}>
        <div className="wrs-container">
          <div className="wrs-detail" style={{ alignItems: 'center' }}>
            <div>
              <Ed as="p" id="home.johnetta.eyebrow" className="wrs-eyebrow">Johnetta Supply</Ed>
              <Ed as="h2" id="home.johnetta.title" className="wrs-h2" style={{ marginBottom: 12 }}>Camp essentials and White Rock goods</Ed>
              <Ed as="p" id="home.johnetta.p1" className="wrs-muted" style={{ marginBottom: 12 }}>
                Johnetta Supply is our seasonal camp store, stocked with everyday camping essentials,
                snacks, cold drinks, firewood, and a few things you may have forgotten at home.
              </Ed>
              <Ed as="p" id="home.johnetta.p2" className="wrs-muted" style={{ marginBottom: 20 }}>
                You'll also find White Rock Station hats, T-shirts, sweatshirts, and other
                merchandise to take home from your time along the Allegheny.
              </Ed>
              <button className="wrs-btn wrs-btn-primary" onClick={() => onNavigate('store')}><Ed as="span" id="home.johnetta.cta">Visit the Store</Ed></button>
            </div>
            <div className="wrs-card__media" style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16 / 10' }}>
              <img src="/images/store/store-10.jpg" alt="Johnetta Supply camp store" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="wrs-section" style={{ background: 'var(--wrs-green)', color: '#fff' }}>
        <div className="wrs-container wrs-center">
          <Ed as="h2" id="home.cta.title" className="wrs-h2" style={{ color: '#fff' }}>Come stay on the river</Ed>
          <Ed as="p" id="home.cta.sub" className="wrs-hero__sub" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            Book directly for the best rate — no third-party fees.
          </Ed>
          <button className="wrs-btn wrs-btn-primary" onClick={() => onNavigate('cottages')}><Ed as="span" id="home.cta.button">Book Your Stay</Ed></button>
        </div>
      </section>
    </div>
  );
}
