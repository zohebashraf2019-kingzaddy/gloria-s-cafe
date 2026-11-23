// Vercel serverless function: POST /api/reserve
// Sends the reservation request to the cafe (and a "request received" email to the guest).
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   – API key from https://resend.com (required to send)
//   CAFE_EMAIL       – where requests go (default: Gloriascafe.nv@gmail.com)
//   FROM_EMAIL       – verified sender, e.g. "Gloria's Cafe <reservations@yourdomain.com>"
//                      (default: Resend's test sender, which can only email your own Resend account)
//
// Until RESEND_API_KEY is set this returns 503, and the website falls back to opening
// the guest's email app with the request pre-filled to the cafe.

const OPEN = { 0: [8, 13.5], 1: [8, 12.5], 2: null, 3: [8, 12.5], 4: [8, 12.5], 5: [8, 12.5], 6: [8, 13.5] };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s, n) => String(s ?? '').trim().slice(0, n);

function toHour(label) {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(label || '');
  if (!m) return NaN;
  let h = +m[1] % 12; if (m[3] === 'PM') h += 12;
  return h + +m[2] / 60;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Email not configured' });

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.company) return res.status(200).json({ ok: true }); // honeypot

  const d = {
    name: clean(b.name, 80), phone: clean(b.phone, 20), email: clean(b.email, 120),
    date: clean(b.date, 10), time: clean(b.time, 8), guests: clean(b.guests, 2),
    seating: clean(b.seating, 20) || 'No preference', notes: clean(b.notes, 500)
  };

  // Validate
  if (!d.name || d.phone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'Name and a valid phone are required.' });
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ error: 'Invalid email.' });
  const g = +d.guests; if (!(g >= 1 && g <= 12)) return res.status(400).json({ error: 'Parties of 13+ please call us.' });
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date);
  if (!m) return res.status(400).json({ error: 'Invalid date.' });
  const day = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
  const hrs = OPEN[day], t = toHour(d.time);
  if (!hrs) return res.status(400).json({ error: "We're closed on Tuesdays." });
  if (!(t >= hrs[0] && t <= hrs[1])) return res.status(400).json({ error: 'That time is outside our hours.' });

  const dateLabel = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const to = process.env.CAFE_EMAIL || 'Gloriascafe.nv@gmail.com';
  const from = process.env.FROM_EMAIL || "Gloria's Cafe <onboarding@resend.dev>";

  const rows = [['Name', d.name], ['Phone', d.phone], ['Email', d.email || '-'], ['Date', dateLabel], ['Time', d.time], ['Guests', d.guests], ['Seating', d.seating], ['Notes', d.notes || '-']]
    .map(([k, v]) => `<tr><td style="padding:8px 14px;color:#8a7a68;font-weight:bold">${k}</td><td style="padding:8px 14px">${esc(v)}</td></tr>`).join('');
  const cafeHtml = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border-top:5px solid #d79132">
    <h2 style="color:#15110d">New reservation request</h2>
    <table style="border-collapse:collapse;background:#faf3e6;width:100%">${rows}</table>
    <p style="margin-top:18px"><a href="tel:${esc(d.phone.replace(/[^\d+]/g, ''))}" style="background:#d79132;color:#15110d;padding:10px 18px;border-radius:20px;text-decoration:none;font-weight:bold">Call ${esc(d.name)} to confirm</a></p></div>`;

  const send = payload => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  try {
    const r = await send({
      from, to: [to], reply_to: d.email || undefined,
      subject: `Reservation request: ${d.name}, ${dateLabel} at ${d.time} (${d.guests} guests)`,
      html: cafeHtml
    });
    if (!r.ok) throw new Error(await r.text());

    if (d.email) {
      await send({
        from, to: [d.email], reply_to: to,
        subject: "We got your reservation request at Gloria's Cafe",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border-top:5px solid #d79132">
          <h2 style="color:#15110d">Thanks, ${esc(d.name.split(' ')[0])}!</h2>
          <p>We received your request for <b>${esc(d.guests)}</b> on <b>${esc(dateLabel)}</b> at <b>${esc(d.time)}</b>.
          This is a request, not a confirmation yet. We'll call or text you at ${esc(d.phone)} to confirm.</p>
          <p>Gloria's Cafe · 2365 Dickerson Rd, Reno, NV 89503 · (775) 409-3277</p></div>`
      }).catch(() => {}); // guest copy is best-effort
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Resend error', e);
    return res.status(502).json({ error: "Couldn't send your request right now." });
  }
};
