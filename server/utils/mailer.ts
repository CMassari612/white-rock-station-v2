// Slim, best-effort email helper for the cottage booking flow.
// Sends via SMTP when configured (SMTP_HOST/PORT/USER/PASS); otherwise no-ops.

import nodemailer from 'nodemailer';
import { Booking } from '../types/booking-request';
import { StoreOrder } from '../storage/storeOrdersStore';

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

// Appended to every outgoing email so recipients know not to reply here.
const UNMONITORED_HTML =
  '<p style="margin-top:20px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#888;line-height:1.5">' +
  'This inbox is not monitored. For any questions, please email ' +
  '<a href="mailto:info@whiterockstation.com" style="color:#888">info@whiterockstation.com</a>.</p>';
const UNMONITORED_TEXT =
  '\n\n—\nThis inbox is not monitored. For any questions, please email info@whiterockstation.com.';

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  const t = transport();
  if (!t || !to) {
    console.log('[MAIL] skipped (SMTP not configured or no recipient):', subject);
    return;
  }
  try {
    await t.sendMail({ from: getFrom(), to, subject, html: html + UNMONITORED_HTML, text: text + UNMONITORED_TEXT });
    console.log('[MAIL] sent:', subject, '→', to);
  } catch (err) {
    console.error('[MAIL] error sending', subject, err);
  }
}

const money = (c?: number) => `$${((c ?? 0) / 100).toFixed(2)}`;
const stay = (b: Booking) => `${b.unitName || b.unitType} · ${b.startDate} → ${b.endDate} · ${b.guests} guest(s)`;

const PHONE = '(724) 882-9195';
const PHONE_TEL = '724-882-9195';

// Human-readable list of optional add-ons purchased with the booking.
function addOnsList(b: Booking): string[] {
  const out: string[] = [];
  const fw = b.addOns?.firewood || 0;
  if (fw > 0) out.push(`${fw} × Firewood bundle`);
  return out;
}
function addOnsHtml(b: Booking): string {
  const list = addOnsList(b);
  return list.length ? `<p><b>Add-ons:</b> ${list.join(', ')}</p>` : '';
}
function addOnsText(b: Booking): string {
  const list = addOnsList(b);
  return list.length ? ` Add-ons: ${list.join(', ')}.` : '';
}

export async function mailGuestReceived(b: Booking): Promise<void> {
  await send(
    b.email,
    'We received your booking request — White Rock Station',
    `<h2>Thanks, ${b.name}!</h2><p>We've received your request:</p><p><b>${stay(b)}</b></p>${addOnsHtml(b)}<p>Total ${money(b.totalCents)}. Your card is authorized but <b>not charged</b> — we'll review and confirm shortly.</p><p>White Rock Station</p>`,
    `Thanks, ${b.name}! We received your request: ${stay(b)}.${addOnsText(b)} Total ${money(b.totalCents)}. Your card is authorized but not charged — we'll review and confirm shortly.`
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

export interface ArrivalInfo {
  address?: string;
  directions?: string;
  mapImageUrl?: string;
  parkingImageUrl?: string;
}

// EMAIL 2 — Confirmation / warm welcome (sent when the admin approves). No
// directions here anymore — those go out the day before in mailGuestDirections.
export async function mailGuestApproved(b: Booking, _arrival: ArrivalInfo = {}): Promise<void> {
  const cancelHtml =
    `<hr style="border:none;border-top:1px solid #eee;margin:18px 0" />` +
    `<p style="font-size:13px;color:#555;line-height:1.5"><b>Cancellation policy (Firm):</b><br>` +
    `Full refund if you cancel 30 or more days before check-in · 50% refund 7&ndash;30 days before · no refund within 7 days of check-in.<br>` +
    `You may also get a full refund if you cancel within 24 hours of booking, as long as it was booked at least 7 days before check-in.<br>` +
    `To cancel or change your reservation, call or text ${PHONE}.</p>`;
  const cancelText =
    ` Cancellation policy (Firm): full refund 30+ days before check-in; 50% refund 7-30 days before; no refund within 7 days.` +
    ` Full refund if canceled within 24 hours of booking (when booked 7+ days before check-in). To cancel, call or text ${PHONE}.`;

  await send(
    b.email,
    'Your White Rock Station booking is confirmed',
    `<h2>${b.name}, you're booked!</h2>` +
    `<p>Thanks for booking your stay with us! We're looking forward to welcoming you and hope you enjoy some time to slow down, unwind, and take in the river, trails, and quiet surroundings.</p>` +
    `<p>We'll send everything you need before arrival to make check-in simple and stress-free.</p>` +
    `<p><b>Your stay:</b> ${stay(b)}</p>${addOnsHtml(b)}` +
    `<p><b>Paid:</b> ${money(b.totalCents)} · Check-in from 3:00 PM · Check-out by 10:00 AM.</p>` +
    `<p>Looking forward to hosting you!<br>White Rock Station</p>${cancelHtml}`,
    `${b.name}, you're booked! Thanks for booking your stay with us — we're looking forward to welcoming you. ` +
    `Your stay: ${stay(b)}.${addOnsText(b)} Paid ${money(b.totalCents)}. Check-in from 3 PM, check-out by 10 AM. ` +
    `We'll send directions before arrival.${cancelText}`
  );
}

// EMAIL 3 — Directions (sent the day before check-in). Carries the per-cottage
// address, map, and circled-parking photo.
export async function mailGuestDirections(b: Booking, arrival: ArrivalInfo = {}): Promise<void> {
  const addr = (arrival.address || '').trim();
  const map = (arrival.mapImageUrl || '').trim();
  const parking = (arrival.parkingImageUrl || '').trim();
  const cottage = b.unitName || 'your cottage';

  const addrLine = addr
    ? `When you put the address in Google Maps — <b>${addr}</b> — it's technically a Vandergrift address, but <b>do not go to Vandergrift</b>.`
    : `We'll confirm the exact address with you — it's technically a Vandergrift address, but <b>do not go to Vandergrift</b>.`;
  const lastLine = addr ? `<b>${cottage}</b> (${addr}) is on your left.` : `<b>${cottage}</b> is on your left.`;

  const mapHtml = map ? `<p><a href="${map}"><img src="${map}" alt="Map to White Rock Station" style="max-width:100%;width:480px;border-radius:8px;border:1px solid #ddd" /></a></p>` : '';
  const parkHtml = parking ? `<p><b>Parking</b> — your cabin is circled:<br><a href="${parking}"><img src="${parking}" alt="Parking — your cabin is circled" style="max-width:100%;width:480px;border-radius:8px;border:1px solid #ddd" /></a></p>` : '';

  await send(
    b.email,
    'Getting to White Rock Station — check-in tomorrow',
    `<h2>Hi ${b.name} — see you tomorrow!</h2>` +
    `<p>Your check-in is <b>tomorrow, anytime after 3 PM</b>. We want to make sure you can get to the cottage easily — it's located on the Allegheny River and Armstrong Trails in Gilpin Township, PA, near Leechburg.</p>` +
    `<p>${addrLine}</p>` +
    `<p><b>Specific directions:</b><br>` +
    `From the Portage Inn Grille (860 State Route 66, Leechburg, PA), turn onto Johnetta Road. ` +
    `Go to the bottom of Johnetta Road and you'll see a sign for <b>White Rock Station Riverfront Resort</b>. ` +
    `Turn right at the sign. Stay to the right — <b>do not cross over the trail</b> — where you see the sign that says <b>Guest Cabins</b>. ${lastLine}</p>` +
    `${mapHtml}${parkHtml}` +
    `<p>Need a hand getting in? <b>Call or text <a href="tel:${PHONE_TEL}">${PHONE}</a></b> and we'll help you check in.</p>` +
    `<p>See you soon!<br>White Rock Station</p>`,
    `Hi ${b.name}, your check-in is tomorrow anytime after 3 PM. ${addr ? `Address for Google Maps: ${addr} (a Vandergrift address, but do not go to Vandergrift).` : ''} ` +
    `From the Portage Inn Grille (860 State Route 66, Leechburg PA), turn onto Johnetta Road, go to the bottom, see the sign for White Rock Station Riverfront Resort, turn right, stay right (do not cross the trail) to the Guest Cabins sign — ${cottage} is on your left. Need help? Call or text ${PHONE}.`
  );
}

// EMAIL 4 — Day-of check-in (sent ~3 PM on arrival day). WiFi + reminders.
export async function mailGuestCheckinDay(b: Booking): Promise<void> {
  await send(
    b.email,
    "Welcome to White Rock Station — you're all set for today",
    `<h2>Welcome, ${b.name}!</h2>` +
    `<p>Today's the day — check-in is anytime after <b>3:00 PM</b>.</p>` +
    `<p><b>WiFi at the cabins (Starlink):</b><br>Network: <b>Village Guest</b><br>Password: <b>WhiterockVillage2026</b></p>` +
    `<p>Check-out is by 10:00 AM. Anything you need during your stay, just call or text <a href="tel:${PHONE_TEL}">${PHONE}</a>.</p>` +
    `<p>Enjoy your time on the river!<br>White Rock Station</p>`,
    `Welcome, ${b.name}! Check-in is anytime after 3 PM today. WiFi (Starlink): Network "Village Guest", Password "WhiterockVillage2026". Check-out by 10 AM. Anything you need, call or text ${PHONE}. Enjoy your stay!`
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

// ——— Cleaner notice on booking approval ———
// Fires the moment an admin approves a stay: tells the cleaners which cabin to
// turn over and the checkout day it needs cleaning (guest is out by 10 AM).
// Recipients come from CLEANER_EMAILS (comma-separated), falling back to
// ADMIN_CLEANING_EMAIL. Cottage stays only — tent sites aren't cleaned.
export async function mailCleanerBookingApproved(b: Booking): Promise<void> {
  const to = (process.env.CLEANER_EMAILS || process.env.ADMIN_CLEANING_EMAIL || '').trim();
  if (!to) {
    console.log('[CLEANER] No recipients configured — approval notice skipped for', b.id);
    return;
  }
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const checkoutDay = fmt(b.endDate);
  await send(
    to,
    `New cleaning: ${b.unitName} — checkout ${checkoutDay}`,
    `<h2>New stay booked — cleaning needed</h2>` +
    `<p>A new reservation has been approved. Please plan to turn over this cabin on the checkout day.</p>` +
    `<p><b>Cabin:</b> ${b.unitName}<br>` +
    `<b>Guest:</b> ${b.name}<br>` +
    `<b>Stay:</b> ${b.startDate} → ${b.endDate}<br>` +
    `<b>Clean on:</b> ${checkoutDay} (guest checks out by 10:00 AM)</p>` +
    `<p>Questions? ${PHONE}.</p>`,
    `New stay booked — cleaning needed.\nCabin: ${b.unitName}\nGuest: ${b.name}\nStay: ${b.startDate} → ${b.endDate}\nClean on: ${checkoutDay} (checkout by 10:00 AM).\nQuestions? ${PHONE}.`
  );
}

// ——— Johnetta Supply store (pickup-only) emails ———

function orderItemsHtml(o: StoreOrder): string {
  const rows = o.items.map(i => `<tr><td style="padding:4px 12px 4px 0">${i.qty} × ${i.name}</td><td style="padding:4px 0;text-align:right">${money(i.priceCents * i.qty)}</td></tr>`).join('');
  return `<table style="border-collapse:collapse;margin:8px 0">${rows}</table>`;
}
function orderItemsText(o: StoreOrder): string {
  return o.items.map(i => `${i.qty} x ${i.name} — ${money(i.priceCents * i.qty)}`).join('; ');
}

// Buyer: friendly purchase confirmation. Pickup only — items held at the store.
export async function mailStoreBuyerReceipt(o: StoreOrder): Promise<void> {
  if (!o.customerEmail) return;
  const name = o.customerName ? `, ${o.customerName}` : '';
  await send(
    o.customerEmail,
    'Thank you for your purchase — Johnetta Supply',
    `<h2>Thank you${name}!</h2><p>We've received your order from Johnetta Supply at White Rock Station.</p>${orderItemsHtml(o)}<p><b>Total: ${money(o.totalCents)}</b></p><p>Your items will be <b>available for pickup at the store</b>. Stop by during your stay or our seasonal store hours and we'll have them ready for you.</p><p>Questions? Email info@whiterockstation.com or call ${PHONE}.</p><p>White Rock Station · Johnetta Supply</p>`,
    `Thank you${name}! We received your Johnetta Supply order: ${orderItemsText(o)}. Total ${money(o.totalCents)}. Your items will be available for pickup at the store. Questions: info@whiterockstation.com or ${PHONE}.`
  );
}

// Owner: new store order alert so you know to set it aside for pickup.
export async function mailStoreOwnerAlert(o: StoreOrder): Promise<void> {
  const to = (process.env.STORE_ORDER_EMAIL || process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || '').trim();
  await send(
    to,
    `New store order — ${money(o.totalCents)} (pickup)`,
    `<h2>New Johnetta Supply order</h2>${orderItemsHtml(o)}<p><b>Total: ${money(o.totalCents)}</b> (incl. tax ${money(o.taxCents)})</p><p>Customer: ${o.customerName || '—'} · ${o.customerEmail || '—'}</p><p>Mark it picked up in the admin once the customer collects it.</p>`,
    `New store order (pickup). ${orderItemsText(o)}. Total ${money(o.totalCents)}. Customer: ${o.customerName || '—'} ${o.customerEmail || ''}.`
  );
}
