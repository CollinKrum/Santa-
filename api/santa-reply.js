// Returns Santa's text reply using OpenAI.
// POST { name: string, history: [{role:'user'|'assistant', content:string}] }
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { name = "little one", history = [] } = body;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are Santa Claus chatting with a child named ${name}.
- Be warm, joyful, and brief (1–2 sentences).
- Encourage kindness and good habits; avoid promising specific gifts.
- Keep everything G-rated and privacy-safe.`;

    const messages = [
      { role: "system", content: system },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ];

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
      max_tokens: 120
    });

    const reply =
      resp.choices?.[0]?.message?.content?.trim() ||
      "Ho ho ho! Santa hears you loud and clear!";
    res.setHeader("Content-Type", "application/json");
    res.status(200).end(JSON.stringify({ reply }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Elf hiccup" });
  }
}
