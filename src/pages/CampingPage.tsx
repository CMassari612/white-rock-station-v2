import { useEffect, useMemo, useState } from 'react';
import { getUnit, dollars, Unit, CHECK_IN_TIME, CHECK_OUT_TIME } from '../lib/cottages';
import { setBookingSelection } from '../lib/bookingSelection';

interface Props {
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

export function CampingPage({ onNavigate }: Props) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  useEffect(() => { getUnit('primitive-camping').then(setUnit).catch(() => setUnit(null)); }, []);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut) return 0;
    const a = new Date(checkIn).getTime(), b = new Date(checkOut).getTime();
    return Math.round((b - a) / 86400000);
  }, [checkIn, checkOut]);

  const rate = unit?.weekdayPriceCents ?? 0;
  const total = nights * rate;
  const datesValid = nights > 0;

  function reserve() {
    if (!unit || !datesValid) return;
    setBookingSelection({ slug: unit.slug, checkIn, checkOut, guests });
    onNavigate('booking', unit.slug);
  }

  const hero = unit?.photos?.[0] ?? '/images/scenery/Scenery 01.jpg';

  return (
    <div className="wrs">
      <section className="wrs-hero" style={{ minHeight: '52vh' }}>
        <div className="wrs-hero__bg" style={{ backgroundImage: `url(${encodeURI(hero)})` }} />
        <div className="wrs-hero__scrim" />
        <div className="wrs-container wrs-hero__inner">
          <p className="wrs-eyebrow" style={{ color: 'var(--wrs-tan)' }}>Back to Nature</p>
          <h1 className="wrs-h1">Primitive Tent Camping</h1>
          <p className="wrs-hero__sub">{unit?.shortDescription ?? 'Simple riverside tent camping along the Allegheny.'}</p>
        </div>
      </section>

      <section className="wrs-section">
        <div className="wrs-container">
          <div className="wrs-detail">
            <div>
              <h2 className="wrs-h2">Riverside, no frills</h2>
              <p className="wrs-p">{unit?.description ?? 'Pitch a tent along the river and enjoy the outdoors.'}</p>
              {!!unit?.amenities?.length && (
                <div className="wrs-chips" style={{ marginTop: 12 }}>
                  {unit.amenities.map(a => <span key={a} className="wrs-chip">{a}</span>)}
                </div>
              )}
              <div className="wrs-note" style={{ marginTop: 22 }}>
                Check-in from <b>{CHECK_IN_TIME}</b> · Check-out by <b>{CHECK_OUT_TIME}</b> · No lodging tax on primitive camping
              </div>
            </div>

            <div className="wrs-bookbox">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span className="wrs-price">{dollars(rate)}</span><span className="wrs-muted">/ night</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="wrs-field" style={{ marginBottom: 0 }}>
                  <label className="wrs-label">Arrive</label>
                  <input className="wrs-input" type="date" min={todayYMD()} value={checkIn}
                    onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(addDaysYMD(e.target.value, 1)); }} />
                </div>
                <div className="wrs-field" style={{ marginBottom: 0 }}>
                  <label className="wrs-label">Depart</label>
                  <input className="wrs-input" type="date" min={checkIn ? addDaysYMD(checkIn, 1) : addDaysYMD(todayYMD(), 1)} value={checkOut}
                    onChange={e => setCheckOut(e.target.value)} />
                </div>
              </div>
              <div className="wrs-field" style={{ marginTop: 12 }}>
                <label className="wrs-label">Campers</label>
                <select className="wrs-select" value={guests} onChange={e => setGuests(Number(e.target.value))}>
                  {Array.from({ length: unit?.maxGuests ?? 6 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              {datesValid && (
                <div style={{ marginTop: 14 }}>
                  <div className="wrs-priceline"><span>{nights} night{nights === 1 ? '' : 's'} × {dollars(rate)}</span><span>{dollars(total)}</span></div>
                  <div className="wrs-priceline wrs-priceline--total"><span>Total</span><span>{dollars(total)}</span></div>
                </div>
              )}
              <button className="wrs-btn wrs-btn-primary wrs-btn-block" style={{ marginTop: 16 }} disabled={!datesValid} onClick={reserve}>
                {datesValid ? 'Reserve a tent site' : 'Select dates'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
