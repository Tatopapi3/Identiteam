// Local dev entrypoint only. The actual Express app (routes, prompts,
// Anthropic client) lives in ./app.ts, shared with the Vercel serverless
// entrypoint at ../api/index.ts — this file just adds the app.listen()
// that a Vercel deployment doesn't need (Vercel invokes the app directly
// per-request instead of a long-running server).
import app from "./app.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

app.listen(PORT, () => {
  console.log(`Future Me API listening on http://localhost:${PORT}`);
});
