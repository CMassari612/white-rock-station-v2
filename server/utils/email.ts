import nodemailer from 'nodemailer';
import { Booking } from '../types/booking-request';
import { format } from 'date-fns';

/**
 * Get SMTP configuration from environment variables
 * Called at send time, not at module load time
 */
function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const isConfigured = !!(host && port && user && pass);
  return { host, port, user, pass, isConfigured };
}

/**
 * The address outgoing email is sent FROM.
 * Defaults to the SMTP login, but EMAIL_FROM lets you authenticate as one
 * mailbox (e.g. admin@) while sending from an alias (e.g. bookings@).
 */
export function getMailFrom(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || '';
}

/**
 * Create Nodemailer transport if SMTP is configured
 * Returns null if not configured, otherwise returns a configured transporter
 */
function createTransportIfConfigured(): nodemailer.Transporter | null {
  const { host, port, user, pass, isConfigured } = getSmtpConfig();

  if (!isConfigured) {
    console.warn('[EMAIL] SMTP is not configured; skipping email send. Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    return null;
  }

  const portNumber = Number(port);
  const secure = portNumber === 465;

  return nodemailer.createTransport({
    host,
    port: portNumber,
    secure, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Get a friendly unit type label
 */
function getUnitTypeLabel(unitType: Booking['unitType']): string {
  const labels: Record<Booking['unitType'], string> = {
    small_cabin: 'Small Cabin',
    large_cabin: 'Large Cabin',
    campsite: 'Campsite',
    marina_slip: 'Marina Slip',
  };
  return labels[unitType] || unitType;
}

/**
 * Get a friendly booking type label
 */
function getBookingTypeLabel(bookingType: Booking['bookingType']): string {
  const labels: Record<Booking['bookingType'], string> = {
    cabin: 'Cabin',
    campsite: 'Campsite',
    marina: 'Marina',
  };
  return labels[bookingType] || bookingType;
}

/**
 * Send email notification to owner when a new booking is created
 */
export async function sendOwnerBookingNotification(booking: Booking): Promise<void> {
  console.log('[EMAIL] sendOwnerBookingNotification called for booking', booking.id);

  const transporter = createTransportIfConfigured();
  if (!transporter) {
    console.log('[EMAIL] Skipping owner email for booking', booking.id, '- SMTP not configured at send time.');
    return;
  }

  const { user } = getSmtpConfig();
  if (!user) {
    console.log('[EMAIL] Skipping owner email for booking', booking.id, '- SMTP_USER not configured at send time.');
    return;
  }

  try {
    const subject = `New booking request – ${getUnitTypeLabel(booking.unitType)} – ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`;
    
    const htmlBody = `
      <h2>New Booking Request Received</h2>
      
      <h3>Booking Details</h3>
      <ul>
        <li><strong>Booking ID:</strong> ${booking.id}</li>
        <li><strong>Status:</strong> ${booking.status}</li>
        <li><strong>Unit Type:</strong> ${getUnitTypeLabel(booking.unitType)}</li>
        <li><strong>Booking Type:</strong> ${getBookingTypeLabel(booking.bookingType)}</li>
        <li><strong>Check-in:</strong> ${formatDate(booking.startDate)}</li>
        <li><strong>Check-out:</strong> ${formatDate(booking.endDate)}</li>
        <li><strong>Guests:</strong> ${booking.guests}</li>
        <li><strong>Created:</strong> ${formatDate(booking.createdAt)}</li>
      </ul>
      
      <h3>Guest Information</h3>
      <ul>
        <li><strong>Name:</strong> ${booking.name}</li>
        <li><strong>Email:</strong> ${booking.email}</li>
        <li><strong>Phone:</strong> ${booking.phone}</li>
      </ul>
      
      ${booking.notes ? `<h3>Notes</h3><p>${booking.notes}</p>` : ''}
      
      <p><em>Please log into the admin dashboard to review and confirm this booking.</em></p>
    `;

    const textBody = `
New Booking Request Received

Booking Details:
- Booking ID: ${booking.id}
- Status: ${booking.status}
- Unit Type: ${getUnitTypeLabel(booking.unitType)}
- Booking Type: ${getBookingTypeLabel(booking.bookingType)}
- Check-in: ${formatDate(booking.startDate)}
- Check-out: ${formatDate(booking.endDate)}
- Guests: ${booking.guests}
- Created: ${formatDate(booking.createdAt)}

Guest Information:
- Name: ${booking.name}
- Email: ${booking.email}
- Phone: ${booking.phone}

${booking.notes ? `Notes:\n${booking.notes}\n` : ''}

Please log into the admin dashboard to review and confirm this booking.
    `.trim();

    console.log('[EMAIL] Sending owner email to', user);

    const info = await transporter.sendMail({
      from: getMailFrom(),
      to: user,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log('[EMAIL] Owner email sent for booking', booking.id);
  } catch (error) {
    console.error('[EMAIL] Error sending owner email for booking', booking.id, error);
    throw error; // Re-throw so caller can log but continue
  }
}

/**
 * Send confirmation email to guest when their booking is created
 */
export async function sendGuestBookingConfirmation(booking: Booking): Promise<void> {
  console.log('[EMAIL] sendGuestBookingConfirmation called for booking', booking.id);

  const transporter = createTransportIfConfigured();
  if (!transporter) {
    console.log('[EMAIL] Skipping guest email for booking', booking.id, '- SMTP not configured at send time.');
    return;
  }

  const { user } = getSmtpConfig();
  if (!user) {
    console.log('[EMAIL] Skipping guest email for booking', booking.id, '- SMTP_USER not configured at send time.');
    return;
  }

  try {
    const subject = `We received your booking request at White Rock Station`;

    const htmlBody = `
      <h2>Thank you for your booking request!</h2>

      <p>Dear ${booking.name},</p>

      <p>We have received your booking request for <strong>${getUnitTypeLabel(booking.unitType)}</strong> at White Rock Station.</p>

      <h3>Your Request Details</h3>
      <ul>
        <li><strong>Unit Type:</strong> ${getUnitTypeLabel(booking.unitType)}</li>
        <li><strong>Check-in:</strong> ${formatDate(booking.startDate)}</li>
        <li><strong>Check-out:</strong> ${formatDate(booking.endDate)}</li>
        <li><strong>Number of Guests:</strong> ${booking.guests}</li>
        <li><strong>Booking ID:</strong> ${booking.id}</li>
      </ul>
      
      ${booking.notes ? `<h3>Your Notes</h3><p>${booking.notes}</p>` : ''}
      
      <p>If you have any questions in the meantime, please feel free to contact us.</p>
      
      <p>We look forward to hosting you!</p>
      
      <p>
        Best regards,<br>
        White Rock Station
      </p>
    `;

    const textBody = `
Thank you for your booking request!

Dear ${booking.name},

We have received your booking request for ${getUnitTypeLabel(booking.unitType)} at White Rock Station.

Your Request Details:
- Unit Type: ${getUnitTypeLabel(booking.unitType)}
- Check-in: ${formatDate(booking.startDate)}
- Check-out: ${formatDate(booking.endDate)}
- Number of Guests: ${booking.guests}
- Booking ID: ${booking.id}

${booking.notes ? `Your Notes:\n${booking.notes}\n` : ''}

If you have any questions in the meantime, please feel free to contact us.

We look forward to hosting you!

Best regards,
White Rock Station
    `.trim();

    console.log('[EMAIL] Sending guest email to', booking.email);

    const info = await transporter.sendMail({
      from: getMailFrom(),
      to: booking.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log('[EMAIL] Guest email sent for booking', booking.id);
  } catch (error) {
    console.error('[EMAIL] Error sending guest email for booking', booking.id, error);
    throw error; // Re-throw so caller can log but continue
  }
}

/**
 * Send confirmation email to guest when an admin APPROVES their booking
 * (the held payment is captured at this point — the charge is now real).
 */
export async function sendGuestBookingApproved(booking: Booking): Promise<void> {
  console.log('[EMAIL] sendGuestBookingApproved called for booking', booking.id);

  const transporter = createTransportIfConfigured();
  if (!transporter) {
    console.log('[EMAIL] Skipping guest approval email for booking', booking.id, '- SMTP not configured at send time.');
    return;
  }

  const { user } = getSmtpConfig();
  if (!user) {
    console.log('[EMAIL] Skipping guest approval email for booking', booking.id, '- SMTP_USER not configured at send time.');
    return;
  }

  try {
    const subject = `Your White Rock Station booking is confirmed`;
    const unitLine = booking.assignedUnitLabel || getUnitTypeLabel(booking.unitType);

    const htmlBody = `
      <h2>Your booking is confirmed!</h2>

      <p>Dear ${booking.name},</p>

      <p>Good news — your booking at White Rock Station has been approved and your payment has now been processed. We look forward to hosting you!</p>

      <h3>Your Booking Details</h3>
      <ul>
        <li><strong>Reservation:</strong> ${unitLine}</li>
        <li><strong>Check-in:</strong> ${formatDate(booking.startDate)}</li>
        <li><strong>Check-out:</strong> ${formatDate(booking.endDate)}</li>
        <li><strong>Number of Guests:</strong> ${booking.guests}</li>
        <li><strong>Booking ID:</strong> ${booking.id}</li>
      </ul>

      ${booking.notes ? `<h3>Your Notes</h3><p>${booking.notes}</p>` : ''}

      <p>If you have any questions before your stay, just reply to this email.</p>

      <p>
        Best regards,<br>
        White Rock Station
      </p>
    `;

    const textBody = `
Your booking is confirmed!

Dear ${booking.name},

Good news — your booking at White Rock Station has been approved and your payment has now been processed. We look forward to hosting you!

Your Booking Details:
- Reservation: ${unitLine}
- Check-in: ${formatDate(booking.startDate)}
- Check-out: ${formatDate(booking.endDate)}
- Number of Guests: ${booking.guests}
- Booking ID: ${booking.id}

${booking.notes ? `Your Notes:\n${booking.notes}\n` : ''}

If you have any questions before your stay, just reply to this email.

Best regards,
White Rock Station
    `.trim();

    await transporter.sendMail({
      from: getMailFrom(),
      to: booking.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log('[EMAIL] Guest approval email sent for booking', booking.id);
  } catch (error) {
    console.error('[EMAIL] Error sending guest approval email for booking', booking.id, error);
    throw error;
  }
}

/**
 * Send email to guest when an admin REJECTS their booking.
 * The card authorization (hold) is voided — no charge is ever taken.
 */
export async function sendGuestBookingDeclined(booking: Booking): Promise<void> {
  console.log('[EMAIL] sendGuestBookingDeclined called for booking', booking.id);

  const transporter = createTransportIfConfigured();
  if (!transporter) {
    console.log('[EMAIL] Skipping guest declined email for booking', booking.id, '- SMTP not configured at send time.');
    return;
  }

  const { user } = getSmtpConfig();
  if (!user) {
    console.log('[EMAIL] Skipping guest declined email for booking', booking.id, '- SMTP_USER not configured at send time.');
    return;
  }

  try {
    const subject = `Update on your White Rock Station booking request`;
    const unitLine = booking.assignedUnitLabel || getUnitTypeLabel(booking.unitType);

    const htmlBody = `
      <h2>About your booking request</h2>

      <p>Dear ${booking.name},</p>

      <p>Thank you for your interest in White Rock Station. Unfortunately, we're unable to confirm your booking request for <strong>${unitLine}</strong> (${formatDate(booking.startDate)} &ndash; ${formatDate(booking.endDate)}) at this time.</p>

      <p><strong>You have not been charged.</strong> The temporary hold placed on your card has been released and the funds will return to your available balance within a few business days, depending on your bank.</p>

      <p>If you have any questions or would like help finding alternate dates, please email us at <a href="mailto:info@whiterockstation.com">info@whiterockstation.com</a> — we'd be glad to help.</p>

      <p>
        Best regards,<br>
        White Rock Station
      </p>
    `;

    const textBody = `
About your booking request

Dear ${booking.name},

Thank you for your interest in White Rock Station. Unfortunately, we're unable to confirm your booking request for ${unitLine} (${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}) at this time.

You have not been charged. The temporary hold placed on your card has been released and the funds will return to your available balance within a few business days, depending on your bank.

If you have any questions or would like help finding alternate dates, please email us at info@whiterockstation.com — we'd be glad to help.

Best regards,
White Rock Station
    `.trim();

    await transporter.sendMail({
      from: getMailFrom(),
      to: booking.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log('[EMAIL] Guest declined email sent for booking', booking.id);
  } catch (error) {
    console.error('[EMAIL] Error sending guest declined email for booking', booking.id, error);
    throw error;
  }
}

/**
 * Overbooking/refund notifications
 * Sent when payment is received but the last unit was sold out before we could confirm.
 */
export async function sendOwnerOverbookedRefundNotification(
  booking: Booking,
  refundId?: string
): Promise<void> {
  console.log('[EMAIL] sendOwnerOverbookedRefundNotification called for booking', booking.id);

  const transporter = createTransportIfConfigured();
  if (!transporter) return;

  const { user } = getSmtpConfig();
  if (!user) return;

  const subject = `OVERBOOKED – refund issued – ${getUnitTypeLabel(booking.unitType)} – ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`;

  const htmlBody = `
    <h2>Overbooked Payment Refunded</h2>
    <p><strong>This booking was NOT confirmed</strong> because inventory was sold out at webhook time.</p>
    <ul>
      <li><strong>Booking ID:</strong> ${booking.id}</li>
      <li><strong>Status:</strong> ${booking.status}</li>
      <li><strong>Unit Type:</strong> ${getUnitTypeLabel(booking.unitType)}</li>
      <li><strong>Dates:</strong> ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}</li>
      <li><strong>Guest:</strong> ${booking.name} (${booking.email})</li>
      <li><strong>Phone:</strong> ${booking.phone}</li>
      <li><strong>Stripe Session:</strong> ${booking.stripeSessionId || '—'}</li>
      <li><strong>Payment Intent:</strong> ${booking.stripePaymentIntentId || '—'}</li>
      <li><strong>Refund:</strong> ${refundId || booking.stripeRefundId || '—'}</li>
      <li><strong>Refunded At:</strong> ${booking.refundAt ? formatDate(booking.refundAt) : '—'}</li>
    </ul>
  `;

  const textBody = `
OVERBOOKED PAYMENT REFUNDED

This booking was NOT confirmed because inventory was sold out at webhook time.

- Booking ID: ${booking.id}
- Status: ${booking.status}
- Unit Type: ${getUnitTypeLabel(booking.unitType)}
- Dates: ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}
- Guest: ${booking.name} (${booking.email})
- Phone: ${booking.phone}
- Stripe Session: ${booking.stripeSessionId || '—'}
- Payment Intent: ${booking.stripePaymentIntentId || '—'}
- Refund: ${refundId || booking.stripeRefundId || '—'}
- Refunded At: ${booking.refundAt || '—'}
  `.trim();

  await transporter.sendMail({
    from: user,
    to: user,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

export async function sendGuestOverbookedRefundNotification(
  booking: Booking,
  guestEmail: string,
  refundId?: string
): Promise<void> {
  console.log('[EMAIL] sendGuestOverbookedRefundNotification called for booking', booking.id);

  const transporter = createTransportIfConfigured();
  if (!transporter) return;

  const { user } = getSmtpConfig();
  if (!user) return;

  if (!guestEmail) {
    console.log('[EMAIL] Skipping guest overbooked email - no guest email available for booking', booking.id);
    return;
  }

  const subject = `Update on your White Rock Station booking – refund issued`;

  const htmlBody = `
    <h2>We’re sorry — your dates sold out</h2>
    <p>Hi ${booking.name},</p>
    <p>We received your payment, but the last available unit for your selected dates sold out before we could confirm your booking.</p>
    <p><strong>We have issued a full refund</strong> to the payment method used at checkout.</p>
    <h3>Details</h3>
    <ul>
      <li><strong>Unit:</strong> ${getUnitTypeLabel(booking.unitType)}</li>
      <li><strong>Dates:</strong> ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}</li>
      <li><strong>Booking ID:</strong> ${booking.id}</li>
      <li><strong>Refund ID:</strong> ${refundId || booking.stripeRefundId || '—'}</li>
    </ul>
    <p>If you’d like help finding alternate dates, just reply to this email.</p>
    <p>— White Rock Station<br/><a href="mailto:${user}">${user}</a></p>
  `;

  const textBody = `
We’re sorry — your dates sold out

Hi ${booking.name},We received your payment, but the last available unit for your selected dates sold out before we could confirm your booking.
We have issued a full refund to the payment method used at checkout.

Details:
- Unit: ${getUnitTypeLabel(booking.unitType)}
- Dates: ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}
- Booking ID: ${booking.id}
- Refund ID: ${refundId || booking.stripeRefundId || '—'}

If you’d like help finding alternate dates, reply to this email.

White Rock Station
${user}
  `.trim();

  await transporter.sendMail({
    from: getMailFrom(),
    to: guestEmail,
    subject,
    text: textBody,
    html: htmlBody,
  });
}