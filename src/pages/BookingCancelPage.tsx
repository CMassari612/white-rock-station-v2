import { useEffect } from 'react';
import { Ed } from '../lib/siteText';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

export function BookingCancelPage({ onNavigate }: Props) {
  // Guest canceled Stripe checkout — release the held dates right away so the
  // unfinished booking doesn't keep the cabin reserved.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('bookingId');
    if (!id) return;
    fetch(`/api/booking/${encodeURIComponent(id)}/abandon`, { method: 'POST' }).catch(() => { /* best-effort */ });
  }, []);

  return (
    <div className="wrs">
      <section className="wrs-section" style={{ paddingTop: 120 }}>
        <div className="wrs-container" style={{ maxWidth: 680 }}>
          <div className="wrs-note">
            <Ed as="h1" id="bookingcancel.title" className="wrs-h2" style={{ marginBottom: 8 }}>Checkout canceled</Ed>
            <Ed as="p" id="bookingcancel.body" className="wrs-p">No worries — you were not charged. Your dates are still available; you can pick up where you left off whenever you're ready.</Ed>
            <button className="wrs-btn wrs-btn-primary" style={{ marginTop: 8 }} onClick={() => onNavigate('cottages')}><Ed as="span" id="bookingcancel.back">Back to cottages</Ed></button>
          </div>
        </div>
      </section>
    </div>
  );
}
