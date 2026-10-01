// Cloned past-self voice.
// 1) Pre-generated Chatterbox clips in public/audio/ (instant) for the demo questions.
// 2) Live Chatterbox TTS through the Comfy Cloud API for everything else (~30s per answer).
// Needs COMFY_CLOUD_API_KEY, comfy/chatterbox_api.json (Export Workflow (API)) and comfy/voice-sample.wav.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://cloud.comfy.org";
// Resolved relative to this file (via import.meta.url), not process.cwd().
// Vercel's build-time file tracer (@vercel/nft) can statically follow a
// __dirname-style relative path and will bundle whatever it points to --
// it can't do that for a path built from process.cwd(), which is only
// known at runtime. That gap is exactly what left these files missing
// from the deployed function before, with liveVoiceReady()/matchClip()
// silently (and correctly) reporting false rather than crashing.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const WORKFLOW = path.join(ROOT, "comfy", "chatterbox_api.json");
const VOICE = path.join(ROOT, "comfy", "voice-sample.wav");
const CLIP_DIR = path.join(ROOT, "public", "audio");

// Pre-generated clips: text must match exactly what the mp3 says.
const CLIPS: { id: string; match: RegExp; text: string }[] = [
  { id: "worried", match: /worr|fear|afraid|scared|anxious/i, text: "You were worried about the interview process. It takes time, there are technical rounds, and you wanted to find people who were truly in alignment with you." },
  { id: "matters", match: /matter|important|care about|value/i, text: "Getting proficient. Understanding AI, the concepts, the data structures, and just vibe coding with AI every day." },
  { id: "hope", match: /hope|different|change/i, text: "You hoped that a year from now you'd be at an AI engineering job you really love. You wanted your own AI business. And you wanted to just enjoy your life." },
  { id: "working", match: /accomplish|working toward|goal|want to (do|be|achieve)/i, text: "You were working toward becoming an AI builder. You said you wanted to be AI native, so one day you could become an AI engineer." },
  { id: "closing", match: /dear future|letter|message|tell myself/i, text: "Dear Future Me. You got this. You're the best. You can do it. Just keep going, and know that people are there to support you, and the world supports you. Love you." },
];

/** Demo shortcut: if the question clearly matches a pre-recorded clip, return it. Off unless VOICE_CLIPS=on. */
export function matchClip(question: string): { text: string; clip: string } | null {
  if (process.env.VOICE_CLIPS !== "on") return null;
  for (const c of CLIPS) {
    if (!c.match.test(question)) continue;
    if (fs.existsSync(path.join(CLIP_DIR, c.id + ".mp3"))) return { text: c.text, clip: `/audio/${c.id}.mp3` };
  }
  return null;
}

const key = () => process.env.COMFY_CLOUD_API_KEY;
const auth = () => ({ "X-API-Key": key() as string });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function liveVoiceReady() {
  return !!key() && fs.existsSync(WORKFLOW) && fs.existsSync(VOICE);
}

let voiceName: string | null = null;
async function uploadVoice() {
  if (voiceName) return voiceName;
  const form = new FormData();
  form.append("image", new Blob([fs.readFileSync(VOICE)], { type: "audio/wav" }), "future-me-voice.wav");
  form.append("type", "input");
  form.append("overwrite", "true");
  const r = await fetch(`${BASE}/api/upload/image`, { method: "POST", headers: auth(), body: form });
  if (!r.ok) throw new Error(`upload ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { name: string; subfolder?: string };
  voiceName = j.subfolder ? `${j.subfolder}/${j.name}` : j.name;
  return voiceName;
}

function buildPrompt(text: string, voice: string) {
  const wf = JSON.parse(fs.readFileSync(WORKFLOW, "utf8")) as Record<string, { class_type: string; inputs: Record<string, unknown> }>;
  for (const node of Object.values(wf)) {
    if (node.class_type === "LoadAudio") node.inputs.audio = voice;
    if (/chatterbox/i.test(node.class_type) && "text" in node.inputs) {
      node.inputs.text = text;
      if ("seed" in node.inputs) node.inputs.seed = Math.floor(Math.random() * 1e9);
      if ("keep_model_loaded" in node.inputs) node.inputs.keep_model_loaded = true;
    }
    if (/save.*audio/i.test(node.class_type) && "filename_prefix" in node.inputs) node.inputs.filename_prefix = "audio/futureme";
  }
  return wf;
}

type OutFile = { filename: string; subfolder?: string; type?: string };
function findAudio(obj: unknown): OutFile | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (Array.isArray(o.audio) && (o.audio[0] as OutFile)?.filename) return o.audio[0] as OutFile;
  for (const v of Object.values(o)) {
    const f = findAudio(v);
    if (f) return f;
  }
  return null;
}

/** Returns the generated speech as an mp3 Buffer. */
export async function synthesize(text: string, timeoutMs = 90_000): Promise<Buffer> {
  const t0 = Date.now();
  const voice = await uploadVoice();
  const r = await fetch(`${BASE}/api/prompt`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: buildPrompt(text, voice) }),
  });
  if (!r.ok) throw new Error(`prompt ${r.status} ${(await r.text()).slice(0, 300)}`);
  const { prompt_id } = (await r.json()) as { prompt_id: string };

  while (true) {
    if (Date.now() - t0 > timeoutMs) throw new Error("Comfy Cloud timed out");
    await sleep(1500);
    const s = await fetch(`${BASE}/api/job/${prompt_id}/status`, { headers: auth() });
    if (!s.ok) continue;
    const { status } = (await s.json()) as { status: string };
    if (status === "success") break;
    if (["error", "non_retryable_error", "lost", "cancelled"].includes(status)) throw new Error(`Comfy job ${status}`);
  }

  let out: OutFile | null = null;
  for (const p of [`/api/history_v2/${prompt_id}`, `/api/history/${prompt_id}`, `/api/jobs/${prompt_id}`]) {
    const h = await fetch(BASE + p, { headers: auth() });
    if (h.ok && (out = findAudio(await h.json()))) break;
  }
  if (!out) throw new Error(`No audio output for job ${prompt_id}`);

  const q = new URLSearchParams({ filename: out.filename, subfolder: out.subfolder || "", type: out.type || "output" });
  const v = await fetch(`${BASE}/api/view?${q}`, { headers: auth(), redirect: "manual" });
  const signed = v.headers.get("location");
  const file = signed ? await fetch(signed) : v;
  if (!file.ok) throw new Error(`download ${file.status}`);
  console.log(`[voice] ${text.length} chars voiced in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return Buffer.from(await file.arrayBuffer());
}
