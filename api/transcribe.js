// api/transcribe.js
import OpenAI from "openai";
import { toFile } from "openai/uploads";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    // Body can arrive as string on Vercel if no body parser for JSON was applied yet
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { audioBase64, mime = "audio/webm" } = body;

    if (!audioBase64) return res.status(400).json({ error: "Missing audioBase64" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Convert base64 -> Buffer -> File for OpenAI SDK
    const buf = Buffer.from(audioBase64, "base64");
    const file = await toFile(buf, `speech.${mime.includes("webm") ? "webm" : "mp3"}`, { type: mime });

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
