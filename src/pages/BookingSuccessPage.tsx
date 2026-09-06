interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

export function BookingSuccessPage({ onNavigate }: Props) {
  return (
    <div className="wrs">
      <section className="wrs-section" style={{ paddingTop: 120 }}>
        <div className="wrs-container" style={{ maxWidth: 680 }}>
          <div className="wrs-card" style={{ padding: 28 }}>
            <p className="wrs-eyebrow">Thank you</p>
            <h1 className="wrs-h2" style={{ marginBottom: 8 }}>Your booking request is in!</h1>
            <p className="wrs-p">
              Your card has been <b>authorized (held), not charged</b>. Our team will review your request and confirm
              shortly — you'll only be charged once it's approved. Keep an eye on your email for the confirmation.
            </p>
            <p className="wrs-muted" style={{ fontSize: 14 }}>Check-in from 3:00 PM · Check-out by 10:00 AM.</p>
            <button className="wrs-btn wrs-btn-primary" style={{ marginTop: 8 }} onClick={() => onNavigate('home')}>Back to home</button>
          </div>
        </div>
      </section>
    </div>
  );
}
