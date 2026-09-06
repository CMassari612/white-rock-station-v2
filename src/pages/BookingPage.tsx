import { useEffect, useMemo, useState } from 'react';
import { getUnit, computePriceBreakdown, dollars, Unit, GUEST_AGREEMENT_TEXT, CHECK_IN_TIME, CHECK_OUT_TIME, createBooking, createCheckoutSession } from '../lib/cottages';
import { getBookingSelection, clearBookingSelection, BookingSelection } from '../lib/bookingSelection';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

const FIREWOOD_CENTS = 800; // placeholder — editable in admin later

export function BookingPage({ onNavigate }: Props) {
  const [sel, setSel] = useState<BookingSelection | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firewood, setFirewood] = useState(0);
  const [promo, setPromo] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const s = getBookingSelection();
    setSel(s);
    if (!s) { setLoading(false); return; }
    getUnit(s.slug).then(setUnit).catch(() => setUnit(null)).finally(() => setLoading(false));
  }, []);

  const breakdown = useMemo(
    () => (unit && sel ? computePriceBreakdown(unit, sel.checkIn, sel.checkOut) : null),
    [unit, sel]
  );

  const addOnCents = firewood * FIREWOOD_CENTS;
  const grandTotal = (breakdown?.totalCents ?? 0) + addOnCents;

  const isCottage = unit?.unitType === 'cottage';

  async function submit() {
    setErr(null);
    if (!unit || !sel) return;
    if (!name.trim() || !email.trim()) { setErr('Please enter your name and email.'); return; }
    if (!agree) { setErr('Please accept the guest agreement to continue.'); return; }
    setSubmitting(true);
    try {
      const { bookingId } = await createBooking({
        unitId: unit.id,
        startDate: sel.checkIn,
        endDate: sel.checkOut,
        guests: sel.guests,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        addOns: { firewood },
        promoCode: promo.trim() || undefined,
        agreedToTerms: agree,
      });
      const { url } = await createCheckoutSession(bookingId);
      clearBookingSelection();
      window.location.href = url; // to Stripe Checkout
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) return <div className="wrs"><div className="wrs-container wrs-section">Loading…</div></div>;

  if (!sel || !unit) return (
    <div className="wrs"><div className="wrs-container wrs-section">
      <h1 className="wrs-h2">Start your booking</h1>
      <p className="wrs-lead">Pick a cottage and your dates to begin.</p>
      <button className="wrs-btn wrs-btn-primary" onClick={() => onNavigate('cottages')}>Browse cottages</button>
    </div></div>
  );

  return (
    <div className="wrs">
      <section style={{ background: 'var(--wrs-green)' }}>
        <div className="wrs-container" style={{ paddingTop: 96, paddingBottom: 22 }}>
          <p className="wrs-eyebrow" style={{ color: 'var(--wrs-tan)' }}>Almost there</p>
          <h1 className="wrs-h1" style={{ color: '#fff', fontSize: 'clamp(28px,4vw,42px)', marginBottom: 0 }}>Complete your booking</h1>
        </div>
      </section>

      <section className="wrs-section">
        <div className="wrs-container">
          <div className="wrs-detail">
            {/* Guest form */}
            <div>
              <h2 className="wrs-h3">Your details</h2>
              <div className="wrs-field"><label className="wrs-label">Full name</label><input className="wrs-input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="wrs-field"><label className="wrs-label">Email</label><input className="wrs-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" /></div>
                <div className="wrs-field"><label className="wrs-label">Phone</label><input className="wrs-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(724) 555-0100" /></div>
              </div>

              <h2 className="wrs-h3" style={{ marginTop: 22 }}>Add-ons</h2>
              <div className="wrs-field">
                <label className="wrs-label">Firewood bundles ({dollars(FIREWOOD_CENTS)} each)</label>
                <select className="wrs-select" value={firewood} onChange={e => setFirewood(Number(e.target.value))} style={{ maxWidth: 160 }}>
                  {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <h2 className="wrs-h3" style={{ marginTop: 12 }}>Promo code</h2>
              <div className="wrs-field"><input className="wrs-input" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} placeholder="Optional" style={{ maxWidth: 260 }} /></div>

              <label className="wrs-check" style={{ marginTop: 16 }}>
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
                <span>{GUEST_AGREEMENT_TEXT}</span>
              </label>

              {err && <div className="wrs-note" style={{ borderLeftColor: '#c0392b', marginTop: 14 }}>{err}</div>}
            </div>

            {/* Summary */}
            <div className="wrs-bookbox">
              <h3 className="wrs-h3">{unit.name}</h3>
              <p className="wrs-muted" style={{ marginTop: 0, fontSize: 14 }}>
                {sel.checkIn} → {sel.checkOut} · {sel.guests} guest{sel.guests === 1 ? '' : 's'}
              </p>
              <div style={{ marginTop: 12 }}>
                {breakdown?.lines.map((l, i) => (
                  <div className="wrs-priceline" key={i}><span>{l.label}</span><span>{dollars(l.amountCents)}</span></div>
                ))}
                {firewood > 0 && <div className="wrs-priceline"><span>Firewood ({firewood} × {dollars(FIREWOOD_CENTS)})</span><span>{dollars(addOnCents)}</span></div>}
                <div className="wrs-priceline wrs-priceline--total"><span>Total</span><span>{dollars(grandTotal)}</span></div>
              </div>
              {!isCottage && <p className="wrs-muted" style={{ fontSize: 13, marginTop: 8 }}>No lodging tax on primitive camping.</p>}
              <button className="wrs-btn wrs-btn-primary wrs-btn-block" style={{ marginTop: 14 }} onClick={submit} disabled={submitting}>
                {submitting ? 'Redirecting to secure checkout…' : 'Continue to payment'}
              </button>
              <p className="wrs-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
                Check-in {CHECK_IN_TIME} · Check-out {CHECK_OUT_TIME}. Your card is held, not charged, until we approve your booking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
