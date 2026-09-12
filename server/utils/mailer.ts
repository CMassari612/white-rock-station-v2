// Slim, best-effort email helper for the cottage booking flow.
// Sends via SMTP when configured (SMTP_HOST/PORT/USER/PASS); otherwise no-ops.

import nodemailer from 'nodemailer';
import { Booking } from '../types/booking-request';

function getFrom(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || '';
}

function transport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  const t = transport();
  if (!t || !to) {
    console.log('[MAIL] skipped (SMTP not configured or no recipient):', subject);
    return;
  }
  try {
    await t.sendMail({ from: getFrom(), to, subject, html, text });
    console.log('[MAIL] sent:', subject, '→', to);
  } catch (err) {
    console.error('[MAIL] error sending', subject, err);
  }
}

const money = (c?: number) => `$${((c ?? 0) / 100).toFixed(2)}`;
const stay = (b: Booking) => `${b.unitName || b.unitType} · ${b.startDate} → ${b.endDate} · ${b.guests} guest(s)`;

export async function mailGuestReceived(b: Booking): Promise<void> {
  await send(
    b.email,
    'We received your booking request — White Rock Station',
    `<h2>Thanks, ${b.name}!</h2><p>We've received your request:</p><p><b>${stay(b)}</b></p><p>Total ${money(b.totalCents)}. Your card is authorized but <b>not charged</b> — we'll review and confirm shortly.</p><p>White Rock Station</p>`,
    `Thanks, ${b.name}! We received your request: ${stay(b)}. Total ${money(b.totalCents)}. Your card is authorized but not charged — we'll review and confirm shortly.`
  );
}

export async function mailAdminApprovalNeeded(b: Booking): Promise<void> {
  const to = (process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || '').trim();
  await send(
    to,
    `Booking needs approval — ${b.unitName || b.unitType}`,
    `<h2>New booking awaiting approval</h2><p><b>${stay(b)}</b></p><p>Guest: ${b.name} · ${b.email} · ${b.phone || '—'}</p><p>Total ${money(b.totalCents)} (card authorized, not captured). Approve in the admin dashboard to charge.</p>`,
    `New booking awaiting approval: ${stay(b)}. Guest: ${b.name} ${b.email} ${b.phone || ''}. Total ${money(b.totalCents)}.`
  );
}

export async function mailGuestApproved(b: Booking, address?: string): Promise<void> {
  const addr = (address || '').trim();
  const addrHtml = addr ? `<p><b>Address:</b> ${addr}</p>` : '';
  const addrText = addr ? ` Address: ${addr}.` : '';
  await send(
    b.email,
    'Your White Rock Station booking is confirmed',
    `<h2>You're booked, ${b.name}!</h2><p>Your stay is confirmed and your payment has been processed.</p><p><b>${stay(b)}</b></p>${addrHtml}<p>Total ${money(b.totalCents)}. Check-in from 3:00 PM · Check-out by 10:00 AM.</p><p>See you on the river!<br>White Rock Station</p>`,
    `You're booked, ${b.name}! Confirmed: ${stay(b)}.${addrText} Total ${money(b.totalCents)}. Check-in 3 PM, check-out 10 AM.`
  );
}

export async function mailGuestDeclined(b: Booking): Promise<void> {
  await send(
    b.email,
    'Update on your White Rock Station booking request',
    `<h2>About your request</h2><p>Dear ${b.name}, unfortunately we can't confirm your request for <b>${stay(b)}</b> at this time. <b>You have not been charged</b> — the hold on your card has been released.</p><p>Questions? Email info@whiterockstation.com.</p><p>White Rock Station</p>`,
    `Dear ${b.name}, we can't confirm your request for ${stay(b)}. You have not been charged; the hold was released. Questions: info@whiterockstation.com.`
  );
}

export async function mailCleaningNotice(b: Booking, cleaningDate: string): Promise<void> {
  const to = (process.env.ADMIN_CLEANING_EMAIL || process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || '').trim();
  await send(
    to,
    `Cleaning needed: ${b.unitName} — ${cleaningDate}`,
    `<h2>Cleaning needed</h2><p><b>${b.unitName}</b></p><p>Guest: ${b.name} · ${b.phone || '—'}</p><p>Stay: ${b.startDate} → ${b.endDate}<br>Cleaning date: ${cleaningDate} (day after checkout)</p>`,
    `Cleaning needed: ${b.unitName}. Guest ${b.name} ${b.phone || ''}. Stay ${b.startDate}→${b.endDate}. Cleaning date ${cleaningDate}.`
  );
}
