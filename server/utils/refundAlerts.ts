import nodemailer from 'nodemailer';
import { Booking } from '../types/booking-request';
import { getMailFrom } from './email';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const isConfigured = !!(host && port && user && pass);
  return { host, port, user, pass, isConfigured };
}

function createTransportIfConfigured(): nodemailer.Transporter | null {
  const { host, port, user, pass, isConfigured } = getSmtpConfig();

  if (!isConfigured) {
    console.warn('[EMAIL] SMTP is not configured; skipping refund alert email.');
    return null;
  }

  const portNumber = Number(port);
  const secure = portNumber === 465;

  return nodemailer.createTransport({
    host,
    port: portNumber,
    secure,
    auth: { user, pass },
  });
}

export async function sendAdminRefundAlert(args: {
  booking: Booking;
  refundId: string;
  paymentIntentId?: string;
  sessionId?: string;
  amountTotalCents?: number | null;
  currency?: string | null;
  refundedAtIso: string;
}): Promise<void> {
  const { booking, refundId, paymentIntentId, sessionId, amountTotalCents, currency, refundedAtIso } = args;

  const transporter = createTransportIfConfigured();
  if (!transporter) return;

  const { user } = getSmtpConfig();
  if (!user) return;

  const to = (process.env.ADMIN_REFUND_EMAIL || 'admin@whiterockstation.com').trim();

  const amountDisplay =
    typeof amountTotalCents === 'number'
      ? `${(amountTotalCents / 100).toFixed(2)} ${String(currency || 'usd').toUpperCase()}`
      : '--';

  const subject = `Refund Issued - Overbooked Booking (${booking.id})`;

  const text = [
    `Refund Issued - Overbooked Booking (${booking.id})`,
    '',
    `Booking ID: ${booking.id}`,
    `Status: ${booking.status}`,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `UnitType: ${booking.unitType}`,
    `Start: ${booking.startDate}`,
    `End: ${booking.endDate}`,
    `Amount: ${amountDisplay}`,
    `Stripe Session ID: ${sessionId || booking.stripeSessionId || '--'}`,
    `PaymentIntent ID: ${paymentIntentId || booking.stripePaymentIntentId || '--'}`,
    `Refund ID: ${refundId}`,
    `Timestamp: ${refundedAtIso}`,
  ].join('\n');

  await transporter.sendMail({
    from: getMailFrom(),
    to,
    cc: user,
    subject,
    text,
  });
}

