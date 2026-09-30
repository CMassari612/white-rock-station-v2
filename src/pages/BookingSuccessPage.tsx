import { Ed } from '../lib/siteText';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

export function BookingSuccessPage({ onNavigate }: Props) {
  return (
    <div className="wrs">
      <section className="wrs-section" style={{ paddingTop: 120 }}>
        <div className="wrs-container" style={{ maxWidth: 680 }}>
          <div className="wrs-card" style={{ padding: 28 }}>
            <Ed as="p" id="bookingsuccess.eyebrow" className="wrs-eyebrow">Thank you</Ed>
            <Ed as="h1" id="bookingsuccess.title" className="wrs-h2" style={{ marginBottom: 8 }}>Your booking request is in!</Ed>
            <p className="wrs-p">
              <Ed as="span" id="bookingsuccess.body.p1a">Your card has been </Ed><b><Ed as="span" id="bookingsuccess.body.bold">authorized (held), not charged</Ed></b><Ed as="span" id="bookingsuccess.body.p1b">. Our team will review your request and confirm shortly — you'll only be charged once it's approved. Keep an eye on your email for the confirmation.</Ed>
            </p>
            <Ed as="p" id="bookingsuccess.times" className="wrs-muted" style={{ fontSize: 14 }}>Check-in from 3:00 PM · Check-out by 10:00 AM.</Ed>
            <button className="wrs-btn wrs-btn-primary" style={{ marginTop: 8 }} onClick={() => onNavigate('home')}><Ed as="span" id="bookingsuccess.back">Back to home</Ed></button>
          </div>
        </div>
      </section>
    </div>
  );
}
