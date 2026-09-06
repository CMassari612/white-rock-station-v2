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
    console.warn('[EMAIL] SMTP is not configured; skipping cleaning notification email.');
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

function isCabinUnitType(unitType: Booking['unitType']): boolean {
  return unitType === 'small_cabin' || unitType === 'large_cabin';
}

export async function sendAdminCleaningNotification(args: {
  booking: Booking;
  cleaningDateYmd: string; // day after last night
}): Promise<void> {
  const { booking, cleaningDateYmd } = args;

  if (!isCabinUnitType(booking.unitType)) return;
  if (booking.status !== 'confirmed') return;
  if (!booking.assignedUnitLabel) {
    console.warn('[EMAIL] Skipping cleaning email - booking missing assignedUnitLabel', booking.id);
    return;
  }

  const transporter = createTransportIfConfigured();
  if (!transporter) return;

  const { user } = getSmtpConfig();
  if (!user) return;

  const to = (process.env.ADMIN_CLEANING_EMAIL || 'admin@whiterockstation.com').trim();
  const subject = `Cleaning Needed: ${booking.assignedUnitLabel} — ${cleaningDateYmd}`;

  const text = [
    subject,
    '',
    `Cabin: ${booking.assignedUnitLabel}`,
    `Guest: ${booking.name}`,
    `Phone: ${booking.phone || '--'}`,
    `Stay dates: ${booking.startDate} → ${booking.endDate}`,
    `Cleaning date: ${cleaningDateYmd} (day after checkout / last night)`,
    '',
    'Checklist:',
    '1. Clean cabin',
    '2. Reset Wi-Fi (power cycle router if needed; confirm SSID + internet connection)',
    '3. Confirm ready for next guest',
    '',
    `Booking ID: ${booking.id}`,
  ].join('\n');

  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject,
    text,
  });
}

