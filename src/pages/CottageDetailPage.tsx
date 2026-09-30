import { useEffect, useMemo, useState } from 'react';
import { getUnit, computePriceBreakdown, dollars, Unit, CHECK_IN_TIME, CHECK_OUT_TIME } from '../lib/cottages';
import { setBookingSelection } from '../lib/bookingSelection';
import { Lightbox } from '../components/Lightbox';
import { Ed } from '../lib/siteText';

interface Props {
  slug?: string;
  onNavigate: (page: string, slug?: string) => void;
}

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDaysYMD(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function CottageDetailPage({ slug, onNavigate }: Props) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    getUnit(slug)
      .then(u => { if (!u) setNotFound(true); else setUnit(u); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const breakdown = useMemo(
    () => (unit && checkIn && checkOut ? computePriceBreakdown(unit, checkIn, checkOut) : null),
    [unit, checkIn, checkOut]
  );

  const datesValid = !!(checkIn && checkOut && checkIn < checkOut);

  function reserve() {
    if (!unit || !datesValid) return;
    setBookingSelection({ slug: unit.slug, checkIn, checkOut, guests });
    onNavigate('booking', unit.slug);
  }

  if (loading) return <div className="wrs"><div className="wrs-container wrs-section">Loading…</div></div>;
  if (notFound || !unit) return (
    <div className="wrs"><div className="wrs-container wrs-section">
      <Ed as="h1" id="cottagedetail.notfound.title" className="wrs-h2">Cottage not found</Ed>
      <p className="wrs-lead"><Ed as="span" id="cottagedetail.notfound.text">That cottage may have moved. </Ed><button className="wrs-btn wrs-btn-outline" onClick={() => onNavigate('cottages')}><Ed as="span" id="cottagedetail.notfound.back">Back to cottages</Ed></button></p>
    </div></div>
  );

  const photos = unit.photos ?? [];
  const guestOptions = Array.from({ length: unit.maxGuests ?? 2 }, (_, i) => i + 1);

  return (
    <div className="wrs">
      {/* Gallery */}
      <section style={{ background: 'var(--wrs-green)' }}>
        <div className="wrs-container" style={{ paddingTop: 96, paddingBottom: 20 }}>
          <button className="wrs-chip" onClick={() => onNavigate('cottages')} style={{ cursor: 'pointer', marginBottom: 14 }}><Ed as="span" id="cottagedetail.gallery.back">← All cottages</Ed></button>
          {photos.length > 0 && (
            <div className="wrs-gallery2" style={photos.length <= 1 ? { gridTemplateColumns: '1fr' } : undefined}>
              <button className="wrs-gallery2__hero" aria-label="Open photo gallery" onClick={() => { setGalleryStart(0); setGalleryOpen(true); }}>
                <img src={encodeURI(photos[0])} alt={unit.name} />
              </button>
              {photos.length > 1 && (
                <div className="wrs-gallery2__side" onClick={() => { setGalleryStart(0); setGalleryOpen(true); }}>
                  <div className="wrs-gallery2__grid">
                    {photos.slice(1, 5).map((p, i) => <img key={i} src={encodeURI(p)} alt={`${unit.name} ${i + 2}`} />)}
                  </div>
                  <div className="wrs-gallery2__overlay">
                    <button className="wrs-gallery2__btn" onClick={(e) => { e.stopPropagation(); setGalleryStart(0); setGalleryOpen(true); }}>
                      <Ed as="span" id="cottagedetail.gallery.viewfull">View full gallery</Ed> ({photos.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {galleryOpen && (
        <Lightbox images={photos} startIndex={galleryStart} title={unit.name} onClose={() => setGalleryOpen(false)} />
      )}

      <section className="wrs-section">
        <div className="wrs-container">
          <div className="wrs-detail">
            {/* Left */}
            <div>
              <p className="wrs-eyebrow">{unit.group}</p>
              <h1 className="wrs-h1" style={{ fontSize: 'clamp(30px,4vw,44px)' }}>{unit.name}</h1>
              <p className="wrs-lead" style={{ marginBottom: 16 }}>{unit.location}{unit.tagline ? ` · ${unit.tagline}` : ''}</p>

              <div className="wrs-specs" style={{ marginBottom: 22 }}>
                <span><b>{unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bedroom${unit.bedrooms === 1 ? '' : 's'}`}</b></span>
                <span><b>{unit.beds}</b> bed{unit.beds === 1 ? '' : 's'}</span>
                <span><b>{unit.baths}</b> bath{unit.baths === 1 ? '' : 's'}</span>
                <span><Ed as="span" id="cottagedetail.specs.sleeps">Sleeps</Ed> <b>{unit.maxGuests}</b></span>
              </div>

              <p className="wrs-p">{unit.description}</p>

              {!!unit.amenities?.length && (
                <>
                  <Ed as="h3" id="cottagedetail.amenities.title" className="wrs-h3" style={{ marginTop: 26 }}>What this cottage includes</Ed>
                  <div className="wrs-chips" style={{ marginTop: 10 }}>
                    {unit.amenities.map(a => <span key={a} className="wrs-chip">{a}</span>)}
                  </div>
                </>
              )}

              <div className="wrs-note" style={{ marginTop: 26 }}>
                <Ed as="span" id="cottagedetail.times.checkin">Check-in from</Ed> <b>{CHECK_IN_TIME}</b> · <Ed as="span" id="cottagedetail.times.checkout">Check-out by</Ed> <b>{CHECK_OUT_TIME}</b>
              </div>
            </div>

            {/* Booking box */}
            <div className="wrs-bookbox">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span className="wrs-price">{dollars(unit.weekdayPriceCents ?? 0)}</span>
                <Ed as="span" id="cottagedetail.price.pernight" className="wrs-muted">/ night (Mon–Thu)</Ed>
              </div>
              <p className="wrs-muted" style={{ marginTop: 0, fontSize: 14 }}>
                <Ed as="span" id="cottagedetail.price.weekend">Fri–Sun</Ed> {dollars(unit.weekendPriceCents ?? 0)}<Ed as="span" id="cottagedetail.price.cleaning">/night · Cleaning fee </Ed>{dollars(unit.cleaningFeeCents ?? 0)}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <div className="wrs-field" style={{ marginBottom: 0 }}>
                  <Ed as="label" id="cottagedetail.field.checkin" className="wrs-label">Check-in</Ed>
                  <input className="wrs-input" type="date" min={todayYMD()} value={checkIn}
                    onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(addDaysYMD(e.target.value, 1)); }} />
                </div>
                <div className="wrs-field" style={{ marginBottom: 0 }}>
                  <Ed as="label" id="cottagedetail.field.checkout" className="wrs-label">Check-out</Ed>
                  <input className="wrs-input" type="date" min={checkIn ? addDaysYMD(checkIn, 1) : addDaysYMD(todayYMD(), 1)} value={checkOut}
                    onChange={e => setCheckOut(e.target.value)} />
                </div>
              </div>

              <div className="wrs-field" style={{ marginTop: 12 }}>
                <Ed as="label" id="cottagedetail.field.guests" className="wrs-label">Guests</Ed>
                <select className="wrs-select" value={guests} onChange={e => setGuests(Number(e.target.value))}>
                  {guestOptions.map(n => <option key={n} value={n}>{n} guest{n === 1 ? '' : 's'}</option>)}
                </select>
              </div>

              {breakdown && (
                <div style={{ marginTop: 16 }}>
                  {breakdown.lines.map((l, i) => (
                    <div className="wrs-priceline" key={i}><span>{l.label}</span><span>{dollars(l.amountCents)}</span></div>
                  ))}
                  <div className="wrs-priceline wrs-priceline--total"><Ed as="span" id="cottagedetail.price.total">Total</Ed><span>{dollars(breakdown.totalCents)}</span></div>
                </div>
              )}

              <button className="wrs-btn wrs-btn-primary wrs-btn-block" style={{ marginTop: 16 }} disabled={!datesValid} onClick={reserve}>
                {datesValid ? <Ed as="span" id="cottagedetail.reserve.ready">Reserve</Ed> : <Ed as="span" id="cottagedetail.reserve.disabled">Select dates to reserve</Ed>}
              </button>
              <Ed as="p" id="cottagedetail.booking.disclaimer" className="wrs-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 0 }}>You won't be charged until your booking is approved.</Ed>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
