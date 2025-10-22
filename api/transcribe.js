// Accepts base64 audio and returns text via Whisper.
import OpenAI from "openai";
import { toFile } from "openai/uploads";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { audioBase64, mime = "audio/webm" } = body;

    if (!audioBase64) return res.status(400).json({ error: "Missing audioBase64" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const buf = Buffer.from(audioBase64, "base64");
    const file = await toFile(
      buf,
      `speech.${mime.includes("webm") ? "webm" : "mp3"}`,
      { type: mime }
    );

    const transcript = await client.audio.transcriptions.create({
      model: "whisper-1",
      file
    });

    const text = (transcript.text || "").trim();
    res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Transcription failed" });
  }
}
