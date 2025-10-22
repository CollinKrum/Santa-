// api/santa-reply.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // robustly detect ?debug=1 from the URL
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const isDebug = url.searchParams.get("debug") === "1";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1) Env check
    if (!process.env.OPENAI_API_KEY) {
      const msg = "Missing OPENAI_API_KEY";
      if (isDebug) return res.status(500).json({ error: msg });
      throw new Error(msg);
    }

    // 2) Body parse (works whether Vercel gave us an object or raw string)
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body || "{}"); } catch { body = {}; }
    }
    const { name = "little one", history = [] } = body || {};

    // 3) OpenAI call
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are Santa Claus chatting with a child named ${name}.
- Be warm, joyful, and brief (1–2 sentences).
- Encourage kindness and good habits; avoid promising specific gifts.
- Keep everything G-rated and privacy-safe.`;

    const messages = [
      { role: "system", content: system },
      ...[]
        .concat(history || [])
        .map(m => ({ role: m.role, content: m.content }))
        .slice(-8),
    ];

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
      max_tokens: 120,
    });

    const reply =
      resp?.choices?.[0]?.message?.content?.trim() ||
      "Ho ho ho! Santa hears you loud and clear!";

    return res.status(200).json({ reply });
  } catch (err) {
    // Log on server
    console.error("[santa-reply] ERROR:", err?.response?.data || err?.message || err);

    if (isDebug) {
      return res.status(500).json({
        error: String(
          err?.response?.data?.error?.message ||
          err?.message ||
          err
        ),
      });
    }
    return res.status(500).json({ error: "Elf hiccup" });
  }
}
