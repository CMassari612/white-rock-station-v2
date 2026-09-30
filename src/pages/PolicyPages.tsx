import { ReactNode } from 'react';

const LAST_UPDATED = 'September 2026';
const PHONE = '(724) 882-9195';
const EMAIL = 'info@whiterockstation.com';

function PolicyLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-14 px-4" style={{ background: 'var(--forest-green)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-white mb-2">{title}</h1>
          <p className="text-white/80 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>
      <section className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto policy-prose text-[var(--forest-green)]/85">
          {children}
        </div>
      </section>
    </div>
  );
}

const h2 = 'text-[var(--forest-green)] mt-8 mb-3';
const li = 'flex items-start mb-2';
const dot = 'text-[var(--river-blue)] mr-2 mt-0.5';

export function CancellationPolicyPage() {
  return (
    <PolicyLayout title="Cancellation Policy">
      <p className="mb-5">
        White Rock Station uses a <strong>Firm</strong> cancellation policy for cottage and campsite
        reservations. Please review it before booking.
      </p>

      <h3 className={h2}>Refund schedule</h3>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span><strong>Full refund</strong> if you cancel <strong>30 days or more</strong> before check-in.</span></li>
        <li className={li}><span className={dot}>•</span><span><strong>50% refund</strong> if you cancel <strong>between 7 and 30 days</strong> before check-in. The refund is generally calculated on the nightly rate; certain fees may be handled separately.</span></li>
        <li className={li}><span className={dot}>•</span><span><strong>No refund</strong> if you cancel <strong>less than 7 days</strong> before check-in.</span></li>
      </ul>

      <h3 className={h2}>24-hour grace period</h3>
      <p className="mb-5">
        You may receive a <strong>full refund</strong> if you cancel within <strong>24 hours of booking</strong>,
        provided the reservation was confirmed <strong>at least 7 days before check-in</strong>.
      </p>

      <h3 className={h2}>How refunds work</h3>
      <p className="mb-5">
        Refunds are issued to the original payment method and are processed securely through Stripe.
        Cleaning fees and applicable taxes may be refunded or retained in line with the schedule above.
      </p>

      <h3 className={h2}>How to cancel</h3>
      <p className="mb-2">
        To cancel or change a reservation, contact us as early as possible:
      </p>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span>Phone or text: <a className="text-[var(--river-blue)] underline" href={`tel:724-882-9195`}>{PHONE}</a></span></li>
        <li className={li}><span className={dot}>•</span><span>Email: <a className="text-[var(--river-blue)] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a></span></li>
      </ul>
      <p className="text-sm text-[var(--forest-green)]/60">
        Reservations made through third-party platforms (such as Airbnb) are governed by that platform's
        cancellation terms.
      </p>
    </PolicyLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy">
      <p className="mb-5">
        White Rock Station ("we," "us") respects your privacy. This policy explains what information we
        collect when you use our website, book a stay, or order from our store, and how we use it.
      </p>

      <h3 className={h2}>Information we collect</h3>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span>Contact details you provide — name, email address, and phone number — when you book a stay, place an order, or contact us.</span></li>
        <li className={li}><span className={dot}>•</span><span>Reservation and order details, such as dates, cottage or item selected, and messages you send us.</span></li>
        <li className={li}><span className={dot}>•</span><span>Payment information is collected and processed securely by our payment provider, Stripe. We do not store your full card number.</span></li>
        <li className={li}><span className={dot}>•</span><span>Basic technical information (such as pages visited) to keep the site working and secure.</span></li>
      </ul>

      <h3 className={h2}>How we use your information</h3>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span>To process and manage your reservations and store orders.</span></li>
        <li className={li}><span className={dot}>•</span><span>To communicate with you about your booking, order, or questions.</span></li>
        <li className={li}><span className={dot}>•</span><span>To operate, improve, and secure our website.</span></li>
        <li className={li}><span className={dot}>•</span><span>To comply with legal and tax obligations.</span></li>
      </ul>

      <h3 className={h2}>How we share information</h3>
      <p className="mb-5">
        We do not sell your personal information. We share it only with service providers who help us
        run the business — for example Stripe (payments), our email provider (booking confirmations), and
        our hosting provider — and only as needed to provide those services, or when required by law.
      </p>

      <h3 className={h2}>Data retention & security</h3>
      <p className="mb-5">
        We keep reservation and order records as long as needed for business and legal purposes, and we
        use reasonable measures to protect your information. No method of transmission or storage is
        completely secure.
      </p>

      <h3 className={h2}>Your choices</h3>
      <p className="mb-5">
        You may ask us to access, correct, or delete the personal information we hold about you by
        contacting us at <a className="text-[var(--river-blue)] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> or{' '}
        <a className="text-[var(--river-blue)] underline" href={`tel:724-882-9195`}>{PHONE}</a>.
      </p>

      <h3 className={h2}>Contact us</h3>
      <p>Questions about this policy? Reach us at {EMAIL} or {PHONE}.</p>
    </PolicyLayout>
  );
}

export function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service">
      <p className="mb-5">
        These Terms of Service govern your use of the White Rock Station website and your reservations
        and store purchases. By using this site or booking with us, you agree to these terms.
      </p>

      <h3 className={h2}>Reservations & payment</h3>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span>All reservations are subject to availability and confirmation.</span></li>
        <li className={li}><span className={dot}>•</span><span>Prices are shown in U.S. dollars. Rates, fees, and applicable taxes are displayed before you confirm.</span></li>
        <li className={li}><span className={dot}>•</span><span>Payments are processed securely through Stripe. When you book, your card may be authorized and charged in accordance with the booking flow.</span></li>
        <li className={li}><span className={dot}>•</span><span>Cancellations and refunds are governed by our <strong>Cancellation Policy</strong>.</span></li>
      </ul>

      <h3 className={h2}>Store orders</h3>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span>Merchandise is subject to availability. Prices and any shipping fees are shown at checkout.</span></li>
        <li className={li}><span className={dot}>•</span><span>You may choose store pickup or shipping at checkout. Payment is processed through Stripe.</span></li>
      </ul>

      <h3 className={h2}>Guest conduct & property</h3>
      <p className="mb-5">
        Guests agree to follow posted rules and to treat the property, cottages, and grounds with care.
        We may decline or cancel a reservation for conduct that endangers guests, staff, or property.
      </p>

      <h3 className={h2}>Limitation of liability</h3>
      <p className="mb-5">
        White Rock Station is not liable for indirect or incidental damages arising from your stay or use
        of the property or website, to the fullest extent permitted by law. Outdoor recreation and river
        access carry inherent risks that guests accept.
      </p>

      <h3 className={h2}>Changes to these terms</h3>
      <p className="mb-5">
        We may update these terms from time to time. The "Last updated" date above reflects the current
        version.
      </p>

      <h3 className={h2}>Governing law</h3>
      <p className="mb-5">These terms are governed by the laws of the Commonwealth of Pennsylvania.</p>

      <h3 className={h2}>Contact us</h3>
      <p>Questions? Reach us at {EMAIL} or {PHONE}.</p>
    </PolicyLayout>
  );
}
