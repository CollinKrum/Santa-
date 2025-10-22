export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const isDebug = url.searchParams.get("debug") === "1";
  if (!isDebug) return res.status(403).json({ error: "Enable ?debug=1" });

  res.json({
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
    ELEVEN_VOICE_ID: !!process.env.ELEVEN_VOICE_ID,
    runtime: "nodejs20.x",
  });
}
