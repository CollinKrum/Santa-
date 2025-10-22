// api/send-letter.js
// Sends the letter via Resend (https://resend.com). No SDK required.
// ENV needed in Vercel (Production):
//   RESEND_API_KEY   -> your Resend API key
//   SANTA_INBOX      -> where to send (e.g. your email)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { from = '—', wishlist = '', body = '', createdAt } =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.SANTA_INBOX; // e.g. "you@yourdomain.com"

    // If not configured, let the front-end fall back to mailto:
    if (!apiKey || !toEmail) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const subject = `Letter to Santa from ${from || '—'}`;
    const text = [
      `Dear Santa,`,
      ``,
      body || '(no message)',
      ``,
      `From: ${from || '—'}`,
      `Wishlist: ${wishlist || '—'}`,
      `Date: ${createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()}`
    ].join('\n');

    // Resend "emails" API
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'North Pole <onboarding@resend.dev>', // or a verified sender on your domain
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
