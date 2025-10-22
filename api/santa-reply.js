// api/santa-reply.js (Groq)
// Env: GROQ_API_KEY
export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const isDebug = url.searchParams.get("debug") === "1";
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch { body = {}; } }
    const { name = "little one", history = [] } = body || {};

    if (!process.env.GROQ_API_KEY) {
      const msg = "Missing GROQ_API_KEY";
      if (isDebug) return res.status(500).json({ error: msg });
      throw new Error(msg);
    }

    const system = `You are Santa Claus chatting with a child named ${name}.
- Be warm, joyful, and brief (1–2 sentences).
- Encourage kindness and good habits; avoid promising specific gifts.
- Keep things G-rated and privacy-safe.`;

    const messages = [
      { role: "system", content: system },
      ...[].concat(history || []).map(m => ({ role: m.role, content: m.content })).slice(-8),
    ];

    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",  // or "llama-3.1-70b-versatile" for higher quality
        messages,
        temperature: 0.8,
        max_tokens: 120
      })
    });

    if (!groqResp.ok) {
      const detail = await groqResp.text();
      if (isDebug) return res.status(200).json({ reply: fallbackLine(name), meta: { fallback: true, detail } });
      return res.status(200).json({ reply: fallbackLine(name), meta: { fallback: true } });
    }

    const data = await groqResp.json();
    const reply = (data.choices?.[0]?.message?.content || "").trim() || fallbackLine(name);
    return res.status(200).json({ reply, meta: { fallback: false } });
  } catch (err) {
    console.error("[santa-reply][groq] ERROR:", err?.message || err);
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const isDebug = url.searchParams.get("debug") === "1";
    const reply = fallbackLine((typeof req.body === "object" && req.body?.name) || "little one");
    if (isDebug) return res.status(200).json({ reply, meta: { fallback: true, reason: "fatal", detail: String(err?.message || err) } });
    return res.status(200).json({ reply, meta: { fallback: true, reason: "fatal" } });
  }
}

const FALLBACKS = [
  "Ho ho ho! I’m busy feeding the reindeer, but I hear you loud and clear, little one!",
  "Mrs. Claus says hello—keep being kind and helpful!",
  "The elves are testing toys—great job being patient!",
  "I’m polishing my boots for the big night. Keep up those good deeds!"
];
function fallbackLine(name) {
  return (FALLBACKS[Math.floor(Math.random()*FALLBACKS.length)]).replace("little one", name || "little one");
}
