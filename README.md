# Future Me

*Capture who you are today. Meet yourself tomorrow.*

A voice-enabled AI time capsule, built around identity: capture a snapshot of
who you are right now, seal it, then — whenever you're ready — talk to that
past version of yourself and see how far you've come.

## The experience

**Who I am → Lock it → Time passes → Meet who I was → See how I changed**

1. **Create Your Capsule** — answer a handful of reflective questions, by
   voice or by typing. A photo is optional.
2. **Identity Snapshot** — AI turns your own words into a short "who I am
   right now" summary. Grounded only in what you said — nothing invented.
3. **Seal the Capsule** — pick 30 days / 6 months / 1 year, watch it lock.
4. **Future Capsule** — in real life you'd wait. **Demo Mode** opens it now.
5. **Talk to Me From the Past** — a voice conversation with your archived
   self. Ask what you were worried about, what you hoped would change — it
   answers only from what's in the capsule, spoken aloud and shown as text.
6. **Milestone Check-In** — tell it what's happened since; AI extracts
   concrete milestones from your own description.
7. **Then vs. Now** — a grounded, AI-written reflection on what changed.
8. **Create Another Time Capsule** — you're not finished becoming.

## Stack

- **Client**: React + TypeScript + Vite, Tailwind CSS v4, Framer Motion.
- **Server**: a small Express API (`server/`) that calls the Anthropic API
  server-side, so the key never reaches the browser.
- **Voice**: the browser's own Web Speech API — `SpeechRecognition` for
  speech-to-text, `speechSynthesis` for the past-self's spoken replies. No
  extra voice API, no extra key. (Chrome/Edge have the best support; other
  browsers fall back to typing, gracefully.)
- **Storage**: capsules live in `localStorage` — no database needed for the
  demo.

## Running it

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npm run dev
```

This runs the Vite client (`:5173`) and the API server (`:8787`) together;
Vite proxies `/api/*` to the server. Open **http://localhost:5173**.

If `ANTHROPIC_API_KEY` isn't set, the server logs a warning and every AI
call fails over to a simple offline fallback (your own answers reflected
back, a naive milestone split) so the demo flow never hard-blocks — but the
real experience needs a key.

## Notes for the demo

- Best in Chrome or Edge (Web Speech API support).
- The mic needs HTTPS or `localhost` — works out of the box in dev.
- "Demo Mode" on the Future Capsule screen skips the wait entirely, for the
  hackathon — the flow is otherwise unchanged from a capsule that reopens
  for real, days or months later.
