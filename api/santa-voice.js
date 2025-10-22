// Streams ElevenLabs TTS audio for Santa's reply.
// POST { text: string }
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { text = "" } = body;

    const voiceId = process.env.ELEVEN_VOICE_ID || "YOUR_DEFAULT_VOICE_ID";
    const apiKey  = process.env.ELEVENLABS_API_KEY;

    const tts = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      })
    });

    if (!tts.ok) {
      const msg = await tts.text();
      return res.status(500).send(msg);
    }

    res.setHeader("Content-Type", "audio/mpeg");
    tts.body.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).send("TTS error");
  }
}
