import { useEffect, useMemo, useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Users, BedDouble, Bed, Bath, Wifi, Snowflake, Flame, Sofa, KeyRound, ArrowLeft } from 'lucide-react';
import { api, LodgingType } from '../lib/api';
import { cabinGalleryImages } from '../lib/galleryImages';
import { CTAButton } from '../components/CTAButton';

interface CabinDetailPageProps {
  unitId?: string;
  lodgingType?: LodgingType;
  onNavigate: (page: string, lodgingType?: LodgingType, unitId?: string) => void;
}

const CONFIG: Record<string, {
  unitType: 'small_cabin' | 'large_cabin';
  price: number; typeTitle: string;
  guests: number; bedrooms: number; beds: number; baths: number;
}> = {
  'small-cabin': { unitType: 'small_cabin', price: 125, typeTitle: 'Small Cabin', guests: 2, bedrooms: 1, beds: 1, baths: 1 },
  'large-cabin': { unitType: 'large_cabin', price: 250, typeTitle: 'Large Cabin', guests: 4, bedrooms: 2, beds: 2, baths: 1 },
};

const DEFAULT_DESCRIPTION =
  'A cozy riverside cabin at White Rock Station, steps from the Allegheny River and the Armstrong Trail. ' +
  'Wake up to water views, spend the day on the river or the trail, and unwind around your own fire ring at night.';

const AMENITIES = [
  { icon: Wifi, label: 'WiFi' },
  { icon: Bed, label: 'Linens' },
  { icon: Flame, label: 'Fire Ring' },
  { icon: Sofa, label: 'Seating Area' },
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYMD(s: string): Date { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function nights(from: Date, to: Date): number { return Math.round((to.getTime() - from.getTime()) / 86400000); }

export function CabinDetailPage({ unitId, lodgingType, onNavigate }: CabinDetailPageProps) {
  const cfg = CONFIG[lodgingType || 'small-cabin'] || CONFIG['small-cabin'];
  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);

  const [unit, setUnit] = useState<{ unitId: string; name: string; photoUrl?: string; description?: string; unavailableDates: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainPhoto, setMainPhoto] = useState(0);

  const [range, setRange] = useState<DateRange | undefined>();
  const [form, setForm] = useState({ name: '', email: '', phone: '', guests: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photos = useMemo(() => {
    const base = unit?.photoUrl ? [unit.photoUrl, ...cabinGalleryImages] : cabinGalleryImages;
    return base.slice(0, 6);
  }, [unit]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getUnitAvailability({ unitType: cfg.unitType, start: ymd(today), end: ymd(addDays(today, 180)) });
      const found = res.units.find(u => u.unitId === unitId) || res.units[0];
      if (found) setUnit({ unitId: found.unitId, name: found.name, photoUrl: found.photoUrl, description: found.description, unavailableDates: found.unavailableDates });
    } catch (e: any) {
      setError(e?.message || 'Could not load this cabin.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [unitId, cfg.unitType]);

  const n = range?.from && range?.to ? nights(range.from, range.to) : 0;
  const subtotal = n * cfg.price;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;

  function selectRange(r: DateRange | undefined) {
    setError(null);
    if (r?.from && r?.to && unit) {
      const booked = new Set(unit.unavailableDates);
      let c = new Date(r.from);
      while (c < r.to) { if (booked.has(ymd(c))) { setError('Those dates include a night this cabin is already booked.'); setRange({ from: r.from, to: undefined }); return; } c = addDays(c, 1); }
    }
    setRange(r);
  }

  async function reserve() {
    if (!range?.from || !range?.to) { setError('Please choose your dates.'); return; }
    if (!unit) { setError('Cabin is still loading — please try again in a moment.'); return; }
    if (!form.name.trim() || !form.email.trim()) { setError('Please enter your name and email.'); return; }
    setSubmitting(true); setError(null);
    try {
      const booking = await api.submitBookingRequest({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
        bookingType: 'cabin', unitType: cfg.unitType, unitId: unit.unitId,
        startDate: ymd(range.from), endDate: ymd(range.to), guests: Number(form.guests) || 1,
      });
      const { url } = await api.createCheckoutSession(booking.id);
      if (url) window.location.href = url;
      else { setError('Could not start checkout.'); setSubmitting(false); }
    } catch (e: any) {
      setError(e?.message || 'Could not reserve. The cabin may have just been taken.');
      setSubmitting(false); load();
    }
  }

  if (loading) return <div className="min-h-screen pt-24 px-4" style={{ textAlign: 'center', opacity: 0.7 }}>Loading cabin…</div>;
  if (!unit) return <div className="min-h-screen pt-24 px-4" style={{ textAlign: 'center' }}>Cabin not found. <button onClick={() => onNavigate('cabin-select', lodgingType)} style={linkBtn}>Back to cabins</button></div>;

  const specItem = (Icon: any, text: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--forest-green)' }}>
      <Icon size={18} /> {text}
    </span>
  );

  return (
    <div className="min-h-screen pt-20 pb-24 px-4" style={{ background: 'var(--off-white)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', paddingTop: 20 }}>
        <button onClick={() => onNavigate('cabin-select', lodgingType)} style={{ ...linkBtn, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <ArrowLeft size={16} /> All {cfg.typeTitle.toLowerCase()}s
        </button>

        <h1 style={{ marginBottom: 6 }}>{unit.name}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18, fontSize: 15 }}>
          {specItem(Users, `${cfg.guests} guests`)}
          {specItem(BedDouble, `${cfg.bedrooms} bedroom${cfg.bedrooms > 1 ? 's' : ''}`)}
          {specItem(Bed, `${cfg.beds} bed${cfg.beds > 1 ? 's' : ''}`)}
          {specItem(Bath, `${cfg.baths} bath`)}
        </div>

        {/* Gallery: main image + thumbnail strip */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', background: 'var(--sand-tan)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            <img src={photos[mainPhoto]} alt={unit.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, overflowX: 'auto' }}>
            {photos.map((p, i) => (
              <button key={i} onClick={() => setMainPhoto(i)} style={{ flex: '0 0 auto', width: 96, height: 72, borderRadius: 10, overflow: 'hidden', border: i === mainPhoto ? '2px solid var(--river-blue)' : '2px solid transparent', padding: 0, cursor: 'pointer', background: 'none' }}>
                <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Two-column: info + booking */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <h3 style={{ marginTop: 0 }}>About this cabin</h3>
            <p style={{ color: 'var(--forest-green)', opacity: 0.85, lineHeight: 1.6 }}>{unit.description || DEFAULT_DESCRIPTION}</p>

            <h3 style={{ marginTop: 28 }}>What this cabin offers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
              {AMENITIES.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--forest-green)' }}>
                  <a.icon size={20} /> <span>{a.label}</span>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: 32 }}>Choose your dates</h3>
            <p style={{ fontSize: 13, color: 'var(--forest-green)', opacity: 0.7, margin: '4px 0 8px' }}>
              Booked nights are greyed out. Check-in starts tomorrow.
            </p>
            <DayPicker mode="range" selected={range} onSelect={selectRange} disabled={[{ before: addDays(today, 1) }, ...unit.unavailableDates.map(parseYMD)]} fromDate={today} numberOfMonths={1} />
          </div>

          {/* Booking card — price, breakdown, contact + guest info, checkout */}
          <div style={{ flex: '0 0 360px', maxWidth: '100%', position: 'sticky', top: 90, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 700 }}>${cfg.price}</span>
              <span style={{ opacity: 0.7 }}> / night</span>
            </div>

            {n > 0 ? (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 12, fontSize: 14 }}>
                <Row label={`$${cfg.price} × ${n} night${n > 1 ? 's' : ''}`} value={`$${subtotal}`} />
                <Row label="Armstrong County lodging tax (5%)" value={`$${tax.toFixed(2)}`} />
                <Row label={<strong>Total</strong>} value={<strong>${(subtotal + tax).toFixed(2)}</strong>} />
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--forest-green)', opacity: 0.7, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 12, margin: 0 }}>
                Pick your check-in and check-out dates on the calendar to see your total.
              </p>
            )}

            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
              <label style={{ fontSize: 13, color: 'var(--forest-green)', opacity: 0.85 }}>
                Number of guests (max {cfg.guests})
                <select value={form.guests} onChange={e => setForm({ ...form, guests: Number(e.target.value) })} style={{ ...inputStyle, marginTop: 4 }}>
                  {Array.from({ length: cfg.guests }, (_, i) => i + 1).map(g => (
                    <option key={g} value={g}>{g} {g === 1 ? 'guest' : 'guests'}</option>
                  ))}
                </select>
              </label>
              <CTAButton onClick={reserve} disabled={submitting} className="w-full justify-center">
                {submitting ? 'Starting checkout…' : 'Reserve & Pay'}
              </CTAButton>
            </div>
            {error && <p style={{ color: '#b3261e', fontSize: 14, marginTop: 10 }}>{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--forest-green)' }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = { border: '1px solid rgba(0,0,0,0.2)', borderRadius: 8, padding: '9px 11px', fontSize: 14, width: '100%' };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--river-blue)', cursor: 'pointer', padding: 0, fontSize: 15 };
