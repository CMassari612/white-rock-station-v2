import { useEffect, useMemo, useState } from 'react';
import { getUnit, computePriceBreakdown, dollars, Unit, CHECK_IN_TIME, CHECK_OUT_TIME } from '../lib/cottages';
import { setBookingSelection } from '../lib/bookingSelection';

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
      <h1 className="wrs-h2">Cottage not found</h1>
      <p className="wrs-lead">That cottage may have moved. <button className="wrs-btn wrs-btn-outline" onClick={() => onNavigate('cottages')}>Back to cottages</button></p>
    </div></div>
  );

  const photos = unit.photos ?? [];
  const guestOptions = Array.from({ length: unit.maxGuests ?? 2 }, (_, i) => i + 1);

  return (
    <div className="wrs">
      {/* Gallery */}
      <section style={{ background: 'var(--wrs-green)' }}>
        <div className="wrs-container" style={{ paddingTop: 96, paddingBottom: 20 }}>
          <button className="wrs-chip" onClick={() => onNavigate('cottages')} style={{ cursor: 'pointer', marginBottom: 14 }}>← All cottages</button>
          <div className="wrs-gallery">
            {photos[0] && <img className="wrs-gallery__hero" src={encodeURI(photos[0])} alt={unit.name} />}
            {photos.slice(1, 5).map((p, i) => <img key={i} src={encodeURI(p)} alt={`${unit.name} ${i + 2}`} />)}
          </div>
        </div>
      </section>

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
                <span>Sleeps <b>{unit.maxGuests}</b></span>
              </div>

              <p className="wrs-p">{unit.description}</p>

              {!!unit.amenities?.length && (
                <>
                  <h3 className="wrs-h3" style={{ marginTop: 26 }}>What this cottage includes</h3>
                  <div className="wrs-chips" style={{ marginTop: 10 }}>
                    {unit.amenities.map(a => <span key={a} className="wrs-chip">{a}</span>)}
                  </div>
                </>
              )}

              <div className="wrs-note" style={{ marginTop: 26 }}>
                Check-in from <b>{CHECK_IN_TIME}</b> · Check-out by <b>{CHECK_OUT_TIME}</b>
              </div>
            </div>

            {/* Booking box */}
            <div className="wrs-bookbox">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <span className="wrs-price">{dollars(unit.weekdayPriceCents ?? 0)}</span>
                <span className="wrs-muted">/ weekday night</span>
              </div>
              <p className="wrs-muted" style={{ marginTop: 0, fontSize: 14 }}>
                Weekends (Fri–Sat) {dollars(unit.weekendPriceCents ?? 0)}/night · Cleaning fee {dollars(unit.cleaningFeeCents ?? 0)}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                <div className="wrs-field" style={{ marginBottom: 0 }}>
                  <label className="wrs-label">Check-in</label>
                  <input className="wrs-input" type="date" min={todayYMD()} value={checkIn}
                    onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(addDaysYMD(e.target.value, 1)); }} />
                </div>
                <div className="wrs-field" style={{ marginBottom: 0 }}>
                  <label className="wrs-label">Check-out</label>
                  <input className="wrs-input" type="date" min={checkIn ? addDaysYMD(checkIn, 1) : addDaysYMD(todayYMD(), 1)} value={checkOut}
                    onChange={e => setCheckOut(e.target.value)} />
                </div>
              </div>

              <div className="wrs-field" style={{ marginTop: 12 }}>
                <label className="wrs-label">Guests</label>
                <select className="wrs-select" value={guests} onChange={e => setGuests(Number(e.target.value))}>
                  {guestOptions.map(n => <option key={n} value={n}>{n} guest{n === 1 ? '' : 's'}</option>)}
                </select>
              </div>

              {breakdown && (
                <div style={{ marginTop: 16 }}>
                  {breakdown.lines.map((l, i) => (
                    <div className="wrs-priceline" key={i}><span>{l.label}</span><span>{dollars(l.amountCents)}</span></div>
                  ))}
                  <div className="wrs-priceline wrs-priceline--total"><span>Total</span><span>{dollars(breakdown.totalCents)}</span></div>
                </div>
              )}

              <button className="wrs-btn wrs-btn-primary wrs-btn-block" style={{ marginTop: 16 }} disabled={!datesValid} onClick={reserve}>
                {datesValid ? 'Reserve' : 'Select dates to reserve'}
              </button>
              <p className="wrs-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
                You won't be charged until your booking is approved.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
