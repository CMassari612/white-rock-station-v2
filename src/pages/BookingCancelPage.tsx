interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

export function BookingCancelPage({ onNavigate }: Props) {
  return (
    <div className="wrs">
      <section className="wrs-section" style={{ paddingTop: 120 }}>
        <div className="wrs-container" style={{ maxWidth: 680 }}>
          <div className="wrs-note">
            <h1 className="wrs-h2" style={{ marginBottom: 8 }}>Checkout canceled</h1>
            <p className="wrs-p">No worries — you were not charged. Your dates are still available; you can pick up where you left off whenever you're ready.</p>
            <button className="wrs-btn wrs-btn-primary" style={{ marginTop: 8 }} onClick={() => onNavigate('cottages')}>Back to cottages</button>
          </div>
        </div>
      </section>
    </div>
  );
}
