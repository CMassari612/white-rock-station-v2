import { ReactNode } from 'react';
import { Ed } from '../lib/siteText';

const LAST_UPDATED = 'September 2026';
const PHONE = '(724) 882-9195';
const EMAIL = 'info@whiterockstation.com';

function PolicyLayout({ title, titleId, children }: { title: string; titleId: string; children: ReactNode }) {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-14 px-4" style={{ background: 'var(--forest-green)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <Ed as="h1" id={titleId} className="text-white mb-2">{title}</Ed>
          <p className="text-white/80 text-sm"><Ed as="span" id="policy.lastupdated">Last updated:</Ed> {LAST_UPDATED}</p>
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
    <PolicyLayout title="Cancellation Policy" titleId="cancellation.title">
      <p className="mb-5">
        <Ed as="span" id="cancellation.intro.p1a">White Rock Station uses a </Ed><strong><Ed as="span" id="cancellation.intro.firm">Firm</Ed></strong><Ed as="span" id="cancellation.intro.p1b"> cancellation policy for cottage and campsite reservations. Please review it before booking.</Ed>
      </p>

      <Ed as="h3" id="cancellation.refund.heading" className={h2}>Refund schedule</Ed>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span><strong><Ed as="span" id="cancellation.refund.li1a">Full refund</Ed></strong><Ed as="span" id="cancellation.refund.li1b"> if you cancel </Ed><strong><Ed as="span" id="cancellation.refund.li1c">30 days or more</Ed></strong><Ed as="span" id="cancellation.refund.li1d"> before check-in.</Ed></span></li>
        <li className={li}><span className={dot}>•</span><span><strong><Ed as="span" id="cancellation.refund.li2a">50% refund</Ed></strong><Ed as="span" id="cancellation.refund.li2b"> if you cancel </Ed><strong><Ed as="span" id="cancellation.refund.li2c">between 7 and 30 days</Ed></strong><Ed as="span" id="cancellation.refund.li2d"> before check-in. The refund is generally calculated on the nightly rate; certain fees may be handled separately.</Ed></span></li>
        <li className={li}><span className={dot}>•</span><span><strong><Ed as="span" id="cancellation.refund.li3a">No refund</Ed></strong><Ed as="span" id="cancellation.refund.li3b"> if you cancel </Ed><strong><Ed as="span" id="cancellation.refund.li3c">less than 7 days</Ed></strong><Ed as="span" id="cancellation.refund.li3d"> before check-in.</Ed></span></li>
      </ul>

      <Ed as="h3" id="cancellation.grace.heading" className={h2}>24-hour grace period</Ed>
      <p className="mb-5">
        <Ed as="span" id="cancellation.grace.p1a">You may receive a </Ed><strong><Ed as="span" id="cancellation.grace.p1b">full refund</Ed></strong><Ed as="span" id="cancellation.grace.p1c"> if you cancel within </Ed><strong><Ed as="span" id="cancellation.grace.p1d">24 hours of booking</Ed></strong><Ed as="span" id="cancellation.grace.p1e">, provided the reservation was confirmed </Ed><strong><Ed as="span" id="cancellation.grace.p1f">at least 7 days before check-in</Ed></strong>.
      </p>

      <Ed as="h3" id="cancellation.how.heading" className={h2}>How refunds work</Ed>
      <Ed as="p" id="cancellation.how.p1" className="mb-5">Refunds are issued to the original payment method and are processed securely through Stripe. Cleaning fees and applicable taxes may be refunded or retained in line with the schedule above.</Ed>

      <Ed as="h3" id="cancellation.cancel.heading" className={h2}>How to cancel</Ed>
      <Ed as="p" id="cancellation.cancel.p1" className="mb-2">To cancel or change a reservation, contact us as early as possible:</Ed>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><span><Ed as="span" id="cancellation.cancel.phone">Phone or text: </Ed><a className="text-[var(--river-blue)] underline" href={`tel:724-882-9195`}>{PHONE}</a></span></li>
        <li className={li}><span className={dot}>•</span><span><Ed as="span" id="cancellation.cancel.email">Email: </Ed><a className="text-[var(--river-blue)] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a></span></li>
      </ul>
      <Ed as="p" id="cancellation.thirdparty.p1" className="text-sm text-[var(--forest-green)]/60">Reservations made through third-party platforms (such as Airbnb) are governed by that platform's cancellation terms.</Ed>
    </PolicyLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" titleId="privacy.title">
      <Ed as="p" id="privacy.intro.p1" className="mb-5">White Rock Station ("we," "us") respects your privacy. This policy explains what information we collect when you use our website, book a stay, or order from our store, and how we use it.</Ed>

      <Ed as="h3" id="privacy.collect.heading" className={h2}>Information we collect</Ed>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.collect.li1">Contact details you provide — name, email address, and phone number — when you book a stay, place an order, or contact us.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.collect.li2">Reservation and order details, such as dates, cottage or item selected, and messages you send us.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.collect.li3">Payment information is collected and processed securely by our payment provider, Stripe. We do not store your full card number.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.collect.li4">Basic technical information (such as pages visited) to keep the site working and secure.</Ed></li>
      </ul>

      <Ed as="h3" id="privacy.use.heading" className={h2}>How we use your information</Ed>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.use.li1">To process and manage your reservations and store orders.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.use.li2">To communicate with you about your booking, order, or questions.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.use.li3">To operate, improve, and secure our website.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="privacy.use.li4">To comply with legal and tax obligations.</Ed></li>
      </ul>

      <Ed as="h3" id="privacy.share.heading" className={h2}>How we share information</Ed>
      <Ed as="p" id="privacy.share.p1" className="mb-5">We do not sell your personal information. We share it only with service providers who help us run the business — for example Stripe (payments), our email provider (booking confirmations), and our hosting provider — and only as needed to provide those services, or when required by law.</Ed>

      <Ed as="h3" id="privacy.retention.heading" className={h2}>Data retention &amp; security</Ed>
      <Ed as="p" id="privacy.retention.p1" className="mb-5">We keep reservation and order records as long as needed for business and legal purposes, and we use reasonable measures to protect your information. No method of transmission or storage is completely secure.</Ed>

      <Ed as="h3" id="privacy.choices.heading" className={h2}>Your choices</Ed>
      <p className="mb-5">
        <Ed as="span" id="privacy.choices.p1a">You may ask us to access, correct, or delete the personal information we hold about you by contacting us at </Ed><a className="text-[var(--river-blue)] underline" href={`mailto:${EMAIL}`}>{EMAIL}</a> <Ed as="span" id="privacy.choices.or">or</Ed>{' '}
        <a className="text-[var(--river-blue)] underline" href={`tel:724-882-9195`}>{PHONE}</a>.
      </p>

      <Ed as="h3" id="privacy.contact.heading" className={h2}>Contact us</Ed>
      <p><Ed as="span" id="privacy.contact.p1a">Questions about this policy? Reach us at </Ed>{EMAIL} <Ed as="span" id="privacy.contact.p1b">or</Ed> {PHONE}.</p>
    </PolicyLayout>
  );
}

export function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service" titleId="terms.title">
      <Ed as="p" id="terms.intro.p1" className="mb-5">These Terms of Service govern your use of the White Rock Station website and your reservations and store purchases. By using this site or booking with us, you agree to these terms.</Ed>

      <Ed as="h3" id="terms.reservations.heading" className={h2}>Reservations &amp; payment</Ed>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><Ed as="span" id="terms.reservations.li1">All reservations are subject to availability and confirmation.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="terms.reservations.li2">Prices are shown in U.S. dollars. Rates, fees, and applicable taxes are displayed before you confirm.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="terms.reservations.li3">Payments are processed securely through Stripe. When you book, your card may be authorized and charged in accordance with the booking flow.</Ed></li>
        <li className={li}><span className={dot}>•</span><span><Ed as="span" id="terms.reservations.li4a">Cancellations and refunds are governed by our </Ed><strong><Ed as="span" id="terms.reservations.li4b">Cancellation Policy</Ed></strong>.</span></li>
      </ul>

      <Ed as="h3" id="terms.store.heading" className={h2}>Store orders</Ed>
      <ul className="mb-5">
        <li className={li}><span className={dot}>•</span><Ed as="span" id="terms.store.li1">Merchandise is subject to availability. Prices and any shipping fees are shown at checkout.</Ed></li>
        <li className={li}><span className={dot}>•</span><Ed as="span" id="terms.store.li2">You may choose store pickup or shipping at checkout. Payment is processed through Stripe.</Ed></li>
      </ul>

      <Ed as="h3" id="terms.conduct.heading" className={h2}>Guest conduct &amp; property</Ed>
      <Ed as="p" id="terms.conduct.p1" className="mb-5">Guests agree to follow posted rules and to treat the property, cottages, and grounds with care. We may decline or cancel a reservation for conduct that endangers guests, staff, or property.</Ed>

      <Ed as="h3" id="terms.liability.heading" className={h2}>Limitation of liability</Ed>
      <Ed as="p" id="terms.liability.p1" className="mb-5">White Rock Station is not liable for indirect or incidental damages arising from your stay or use of the property or website, to the fullest extent permitted by law. Outdoor recreation and river access carry inherent risks that guests accept.</Ed>

      <Ed as="h3" id="terms.changes.heading" className={h2}>Changes to these terms</Ed>
      <Ed as="p" id="terms.changes.p1" className="mb-5">We may update these terms from time to time. The "Last updated" date above reflects the current version.</Ed>

      <Ed as="h3" id="terms.law.heading" className={h2}>Governing law</Ed>
      <Ed as="p" id="terms.law.p1" className="mb-5">These terms are governed by the laws of the Commonwealth of Pennsylvania.</Ed>

      <Ed as="h3" id="terms.contact.heading" className={h2}>Contact us</Ed>
      <p><Ed as="span" id="terms.contact.p1a">Questions? Reach us at </Ed>{EMAIL} <Ed as="span" id="terms.contact.p1b">or</Ed> {PHONE}.</p>
    </PolicyLayout>
  );
}
