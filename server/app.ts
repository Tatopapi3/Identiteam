import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import type { CapsuleAnswers, IdentitySnapshot } from "../src/state/capsule";
import {
  CHAT_SYSTEM_PROMPT,
  MILESTONE_SYSTEM_PROMPT,
  REFLECTION_SYSTEM_PROMPT,
  SNAPSHOT_SYSTEM_PROMPT,
  answersBlock,
  snapshotBlock,
} from "./prompts";
import { liveVoiceReady, matchClip, synthesize } from "./voice";

// Express app itself, with no app.listen() call -- shared between the local
// dev entrypoint (index.ts) and the Vercel serverless entrypoint
// (../api/index.ts), so there's exactly one place the routes are defined.

const MODEL = "claude-sonnet-5";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn(
    "\n⚠️  ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key locally, " +
      "or set it in the Vercel project's Environment Variables — until then, every AI call " +
      "will fail and the app will fall back to its offline behavior.\n",
  );
}

const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

function extractJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

async function complete(system: string, user: string, maxTokens = 600): Promise<string> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response shape from the model.");
  return block.text;
}

app.post("/api/snapshot", async (req, res) => {
  try {
    const answers = req.body.answers as CapsuleAnswers;
    const text = await complete(
      SNAPSHOT_SYSTEM_PROMPT,
      `Here is what this person shared:\n\n${answersBlock(answers)}`,
      700,
    );
    const snapshot = extractJson<IdentitySnapshot>(text);
    res.json({ snapshot });
  } catch (error: any) {
    console.error("[/api/snapshot]", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { answers, snapshot, question, history } = req.body as {
      answers: CapsuleAnswers;
      snapshot: IdentitySnapshot;
      question: string;
      history: { role: "user" | "assistant"; text: string }[];
    };

    // Demo: questions that match a pre-recorded cloned-voice clip answer instantly with it.
    const clip = matchClip(question);
    if (clip) return res.json({ reply: clip.text, clip: clip.clip });

    const historyText = history
      .map((h) => `${h.role === "user" ? "Future self asks" : "Past self answered"}: ${h.text}`)
      .join("\n");

    const userMessage = `Archived answers from the capsule:
${answersBlock(answers)}

Identity snapshot captured at sealing time:
${snapshotBlock(snapshot)}

${historyText ? `Conversation so far:\n${historyText}\n` : ""}
Your future self just asked: "${question}"

Reply as their past self, in character, grounded only in the archive above.`;

    const reply = await complete(CHAT_SYSTEM_PROMPT, userMessage, 350);
    res.json({ reply: reply.trim() });
  } catch (error: any) {
    console.error("[/api/chat]", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Live cloned voice (Comfy Cloud Chatterbox). Returns audio/mpeg, or 503 so the client falls back to browser TTS.
app.get("/api/voice", (_req, res) => {
  res.json({ liveVoice: liveVoiceReady(), clips: process.env.VOICE_CLIPS === "on" });
});

app.post("/api/tts", async (req, res) => {
  const { text } = req.body as { text: string };
  if (!liveVoiceReady() || !text?.trim()) return res.status(503).json({ error: "live voice not configured" });
  try {
    const mp3 = await synthesize(text);
    res.set("Content-Type", "audio/mpeg").send(mp3);
  } catch (error: any) {
    console.error("[/api/tts]", error.message);
    res.status(503).json({ error: error.message });
  }
});

app.post("/api/milestones", async (req, res) => {
  try {
    const { freeformText } = req.body as { freeformText: string };
    const text = await complete(
      MILESTONE_SYSTEM_PROMPT,
      `Here's what they said happened:\n\n"${freeformText}"`,
      400,
    );
    const { milestones } = extractJson<{ milestones: string[] }>(text);
    res.json({ milestones });
  } catch (error: any) {
    console.error("[/api/milestones]", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reflect", async (req, res) => {
  try {
    const { answers, snapshot, milestones } = req.body as {
      answers: CapsuleAnswers;
      snapshot: IdentitySnapshot;
      milestones: string[];
    };
    const userMessage = `Then (identity snapshot at sealing time):
${snapshotBlock(snapshot)}

Original answers, for extra context:
${answersBlock(answers)}

Now (milestones since the capsule opened):
${milestones.length ? milestones.map((m) => `- ${m}`).join("\n") : "(none recorded)"}`;

    const reflection = await complete(REFLECTION_SYSTEM_PROMPT, userMessage, 300);
    res.json({ reflection: reflection.trim() });
  } catch (error: any) {
    console.error("[/api/reflect]", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(apiKey) });
});

export default app;
