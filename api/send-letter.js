// api/send-letter.js
// Sends the letter using Resend's Email API.
// Vercel ENV (Production):
//   RESEND_API_KEY  -> your Resend API key
//   SANTA_INBOX     -> destination email (your inbox)
//   SENDER_EMAIL    -> a verified sender, e.g. "northpole@yourdomain.com"
//                      (Resend requires a verified domain/sender)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const isJson = req.headers['content-type']?.includes('application/json');
    const body = isJson ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})) : {};
    const {
      from = '—',
      wishlist = '',
      body: letterBody = '',
      createdAt
    } = body;

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.SANTA_INBOX;      // e.g. "you@yourdomain.com"
    const sender  = process.env.SENDER_EMAIL;     // e.g. "North Pole <northpole@yourdomain.com>"

    if (!apiKey || !toEmail || !sender) {
      console.error('[send-letter] Missing env: RESEND_API_KEY or SANTA_INBOX or SENDER_EMAIL');
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const subject = `Letter to Santa from ${from || '—'}`;
    const text = [
      `Dear Santa,`,
      ``,
      (letterBody || '(no message)'),
      ``,
      `From: ${from || '—'}`,
      `Wishlist: ${wishlist || '—'}`,
      `Date: ${createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}`
    ].join('\n');

    // Resend REST API
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: sender,         // must be verified in Resend
        to: [toEmail],
        subject,
        text
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('[send-letter] Resend error:', r.status, detail);
      return res.status(500).json({ error: 'Failed to send' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[send-letter] Fatal:', e?.message || e);
    return res.status(500).json({ error: 'Failed to send' });
  }
}
