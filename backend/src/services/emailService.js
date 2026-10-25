import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!env.smtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/** Sends one email. Never throws: an email problem must never break an order. */
export async function sendMail({ to, subject, html, text, replyTo }) {
  const t = getTransporter();
  if (!t || !to) return false;

  try {
    await t.sendMail({ from: env.EMAIL_FROM, to, subject, html, text, replyTo });
    return true;
  } catch (err) {
    console.error(`Email "${subject}" to ${to} failed:`, err.message);
    return false;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
const money = (amount, currency) => `${currency} ${Number(amount).toLocaleString('en-PK')}`;

function orderHtml(order, items, { heading, intro, currency, footer }) {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.name)}
          <span style="color:#888">(${esc(i.sku)})</span> &times; ${i.quantity}</td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${money(i.lineTotal, currency)}</td>
      </tr>`
    )
    .join('');

  const a = order.shippingAddress;

  return `
  <div style="background:#F7F3EC;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#2B2B2B">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#0A0A0A;padding:20px;text-align:center">
        <span style="color:#D4AF37;font-size:22px;letter-spacing:4px">CRYSTAL ZONE</span>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 8px;font-family:Georgia,serif">${esc(heading)}</h2>
        <p style="margin:0 0 16px">${intro}</p>
        <p style="margin:0 0 16px"><strong>Order ID:</strong> ${esc(order.orderId)}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
          <tr><td style="padding-top:12px">Subtotal</td><td align="right" style="padding-top:12px">${money(order.subtotal, currency)}</td></tr>
          <tr><td>Discount</td><td align="right">- ${money(order.discount, currency)}</td></tr>
          <tr><td>Shipping</td><td align="right">${order.shippingFee === 0 ? 'Free' : money(order.shippingFee, currency)}</td></tr>
          <tr><td style="padding-top:8px"><strong>Total (Cash on Delivery)</strong></td>
              <td align="right" style="padding-top:8px"><strong>${money(order.total, currency)}</strong></td></tr>
        </table>
        <h3 style="margin:24px 0 8px;font-family:Georgia,serif">Delivery details</h3>
        <p style="margin:0;font-size:14px;line-height:1.6">
          ${esc(a.fullName)}<br>${esc(a.phone)}<br>
          ${esc(a.address)}<br>${esc(a.city)}, ${esc(a.province)} ${esc(a.postalCode)}
          ${order.notes ? `<br><em>Note: ${esc(order.notes)}</em>` : ''}
        </p>
        ${footer}
      </div>
    </div>
  </div>`;
}

/** Order confirmation to the customer + new-order alert to the store owner. Fire and forget. */
export async function sendOrderEmails(order, items, settings) {
  try {
    const currency = settings.currency;
    const trackUrl = `${env.APP_URL}/track-order?orderId=${encodeURIComponent(order.orderId)}`;

    const customerHtml = orderHtml(order, items, {
      heading: 'Thank you for your order!',
      intro: `Hi ${esc(order.customer.name)}, we have received your order and will confirm it shortly.`,
      currency,
      footer: `<p style="margin:24px 0 0"><a href="${esc(trackUrl)}"
        style="background:#D4AF37;color:#0A0A0A;padding:12px 24px;border-radius:24px;text-decoration:none;display:inline-block">Track your order</a></p>
        <p style="margin:16px 0 0;font-size:12px;color:#888">Questions? WhatsApp or call ${esc(settings.phone)}.</p>`,
    });

    const adminHtml = orderHtml(order, items, {
      heading: 'New order received',
      intro: `${esc(order.customer.name)} placed a new order. Phone: ${esc(order.customer.phone)}, Email: ${esc(order.customer.email)}.`,
      currency,
      footer: '<p style="margin:24px 0 0;font-size:12px;color:#888">Manage it in your admin panel under Orders.</p>',
    });

    await Promise.all([
      sendMail({
        to: order.customer.email,
        subject: `Your Crystal Zone order ${order.orderId}`,
        html: customerHtml,
        text: `Thank you for your order ${order.orderId}. Total: ${money(order.total, currency)} (Cash on Delivery). Track it: ${trackUrl}`,
      }),
      sendMail({
        to: env.ADMIN_NOTIFY_EMAIL || settings.email,
        subject: `New order ${order.orderId} (${money(order.total, currency)})`,
        html: adminHtml,
        replyTo: order.customer.email,
      }),
    ]);
  } catch (err) {
    console.error('Order emails failed:', err.message);
  }
}