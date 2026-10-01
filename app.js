// Note to Self 3000 — AI Time Capsule (vanilla, no build step)
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const store = {
  get() { try { return JSON.parse(localStorage.getItem("capsule")) || {}; } catch { return {}; } },
  set(v) { try { localStorage.setItem("capsule", JSON.stringify(v)); } catch {} },
};
let capsule = store.get();

/* ---------- Navigation ---------- */
function go(id) {
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === id));
  $$(".topbar nav button").forEach((b) => b.classList.toggle("on", b.dataset.go === id));
  if (id === "snapshot") renderSnapshot();
  if (id === "talk") initTalk();
  if (id === "checkin") renderCompare();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));

/* ---------- Particles ---------- */
const pc = $("#particles"), px = pc.getContext("2d");
let parts = [], converge = false;
function sizeCanvas() { pc.width = innerWidth; pc.height = innerHeight; }
sizeCanvas(); addEventListener("resize", sizeCanvas);
for (let i = 0; i < 90; i++) parts.push({
  x: Math.random() * innerWidth, y: Math.random() * innerHeight,
  vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
  r: Math.random() * 1.8 + .4, c: Math.random() > .5 ? "255,209,102" : "72,202,228",
});
(function tick() {
  px.clearRect(0, 0, pc.width, pc.height);
  const cx = pc.width / 2, cy = pc.height / 2.4;
  for (const p of parts) {
    if (converge) { p.x += (cx - p.x) * .05; p.y += (cy - p.y) * .05; }
    else {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > pc.width) p.vx *= -1;
      if (p.y < 0 || p.y > pc.height) p.vy *= -1;
    }
    px.beginPath(); px.arc(p.x, p.y, p.r, 0, 7);
    px.fillStyle = `rgba(${p.c},.7)`; px.fill();
  }
  requestAnimationFrame(tick);
})();

/* ---------- Create: multi-step ---------- */
const STEPS = ["Name & photo", "Voice message", "Work, goals, worries, values", "Dear Future Me…"];
let step = 0;
const fields = ["name", "transcript", "work", "goals", "worries", "values", "letter", "become"];
fields.forEach((f) => { const el = $("#f-" + f); el.value = capsule[f] || ""; el.addEventListener("input", save); });
if (capsule.photo) showPhoto(capsule.photo);

function save() {
  fields.forEach((f) => (capsule[f] = $("#f-" + f).value.trim()));
  store.set(capsule);
}
function showStep() {
  $$(".step").forEach((s) => s.classList.toggle("on", +s.dataset.step === step));
  $("#stepLabel").textContent = `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`;
  $("#barFill").style.width = ((step + 1) / STEPS.length) * 100 + "%";
  $("#prevBtn").style.visibility = step ? "visible" : "hidden";
  $("#nextBtn").textContent = step === STEPS.length - 1 ? "Preview Snapshot →" : "Next →";
}
$("#prevBtn").onclick = () => { step = Math.max(0, step - 1); showStep(); };
$("#nextBtn").onclick = () => {
  save();
  if (step < STEPS.length - 1) { step++; showStep(); } else go("snapshot");
};
showStep();

$("#f-photo").onchange = (e) => {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = () => { capsule.photo = r.result; store.set(capsule); showPhoto(r.result); };
  r.readAsDataURL(file);
};
function showPhoto(src) { const i = $("#photoPreview"); i.src = src; i.hidden = false; $("#photoHint").hidden = true; }

/* ---------- Voice recording + visualizer + transcription ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, mediaRec = null, audioCtx, analyser, raf, stream, recognizing = false;

$("#micBtn").onclick = async () => (recognizing ? stopRec() : startRec());

async function startRec() {
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { alert("Microphone access is needed to record."); return; }
  recognizing = true;
  $("#micBtn").classList.add("rec"); $(".mic-wrap").classList.add("live");

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser(); analyser.fftSize = 128;
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  drawWave();

  const chunks = [];
  mediaRec = new MediaRecorder(stream);
  mediaRec.ondataavailable = (e) => chunks.push(e.data);
  mediaRec.onstop = () => {
    const a = $("#playback"); a.src = URL.createObjectURL(new Blob(chunks)); a.hidden = false;
  };
  mediaRec.start();

  if (SR) {
    const base = $("#f-transcript").value ? $("#f-transcript").value + " " : "";
    rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e) => {
      $("#f-transcript").value = base + [...e.results].map((r) => r[0].transcript).join(" ");
      save();
    };
    rec.start();
  }
}
function stopRec() {
  recognizing = false;
  $("#micBtn").classList.remove("rec"); $(".mic-wrap").classList.remove("live");
  rec && rec.stop(); mediaRec && mediaRec.state !== "inactive" && mediaRec.stop();
  stream && stream.getTracks().forEach((t) => t.stop());
  cancelAnimationFrame(raf); audioCtx && audioCtx.close();
  $$(".pring").forEach((r) => r.style.setProperty("--s", 1));
}
function drawWave() {
  const c = $("#wave"), g = c.getContext("2d");
  c.width = c.clientWidth;
  const data = new Uint8Array(analyser.frequencyBinCount);
  const grad = g.createLinearGradient(0, 0, c.width, 0);
  grad.addColorStop(0, "#FFD166"); grad.addColorStop(.5, "#F4A261"); grad.addColorStop(1, "#48CAE4");
  (function frame() {
    analyser.getByteFrequencyData(data);
    g.clearRect(0, 0, c.width, c.height);
    const w = c.width / data.length;
    let sum = 0;
    data.forEach((v, i) => {
      sum += v;
      const h = (v / 255) * c.height;
      g.fillStyle = grad;
      g.fillRect(i * w + 1, (c.height - h) / 2, w - 2, h || 2);
    });
    const lvl = sum / data.length / 255;
    $$(".pring").forEach((r, i) => r.style.setProperty("--s", 1 + lvl * (1.2 + i * .8)));
    raf = requestAnimationFrame(frame);
  })();
}

/* ---------- Snapshot ---------- */
const or = (v, d = "—") => v || d;
function renderSnapshot() {
  save();
  $("#snapName").textContent = or(capsule.name, "Future Me");
  $("#snapDate").textContent = "Captured " + new Date().toLocaleDateString(undefined, { dateStyle: "long" });
  const p = $("#snapPhoto"); p.hidden = !capsule.photo; if (capsule.photo) p.src = capsule.photo;
  $("#s-now").textContent = [capsule.work && "Work: " + capsule.work, capsule.values && "Values: " + capsule.values, capsule.transcript]
    .filter(Boolean).join("\n\n") || "—";
  $("#s-goals").textContent = or(capsule.goals);
  $("#s-worries").textContent = or(capsule.worries);
  $("#s-become").textContent = or(capsule.become);
}
let days = 30;
$$("#durations .chip").forEach((c) => (c.onclick = () => {
  $$("#durations .chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); days = +c.dataset.days;
}));

/* ---------- Seal animation ---------- */
function beep(freq, t0, dur, ctx) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(.0001, ctx.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(.2, ctx.currentTime + t0 + .02);
  g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + t0 + dur);
  o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur);
}
$("#sealBtn").onclick = () => {
  save();
  const demo = $("#demoMode").checked;
  const sealedAt = Date.now();
  capsule.sealedAt = sealedAt;
  capsule.unlockAt = demo ? sealedAt : sealedAt + days * 864e5;
  capsule.days = days; store.set(capsule);

  go("sealing");
  const v = $("#sealVault"); v.className = "vault big locking";
  $("#sealTitle").textContent = "Sealing your capsule…"; $("#sealDate").textContent = ""; $("#openBtn").hidden = true;
  $("#lockIcon").textContent = "🔓";
  converge = true;
  try { const ctx = new AudioContext(); [440, 554, 659, 880].forEach((f, i) => beep(f, i * .35, .3, ctx)); beep(220, 1.6, .8, ctx); } catch {}

  setTimeout(() => {
    v.className = "vault big locked"; $("#lockIcon").textContent = "🔒";
    $("#sealTitle").innerHTML = '<span class="grad">Capsule Sealed</span>';
    const d = new Date(capsule.unlockAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
    $("#sealDate").textContent = (demo ? "Demo Mode: unlocked instantly · would reopen in " + days + " days" : "Reopens on " + d);
    $("#openBtn").hidden = !demo;
    setTimeout(() => { converge = false; parts.forEach((p) => { p.vx = (Math.random() - .5) * 4; p.vy = (Math.random() - .5) * 4; }); setTimeout(() => parts.forEach((p) => { p.vx *= .1; p.vy *= .1; }), 600); }, 300);
  }, 1800);
};
$("#openBtn").onclick = () => go("talk");

/* ---------- Talk to Your Past Self ---------- */
let talkInit = false;
function initTalk() {
  if (capsule.unlockAt && Date.now() < capsule.unlockAt) {
    $("#chat").innerHTML = "";
    bubble("past", `I'm still sealed. Come back on ${new Date(capsule.unlockAt).toLocaleDateString()}.`);
    return;
  }
  if (talkInit) return; talkInit = true;
  $("#chat").innerHTML = "";
  say(`Hey ${capsule.name || "you"}. It's me — well, you, from ${capsule.sealedAt ? new Date(capsule.sealedAt).toLocaleDateString() : "before"}. Ask me anything.`);
}
function bubble(who, text) {
  const b = document.createElement("div"); b.className = "bubble " + who; b.textContent = text;
  $("#chat").append(b); $("#chat").scrollTop = 1e9; return b;
}
function say(text) {
  const b = bubble("past", "");
  // stream the transcript word by word while the voice speaks
  const words = text.split(" "); let i = 0;
  const t = setInterval(() => { b.textContent += (i ? " " : "") + words[i++]; $("#chat").scrollTop = 1e9; if (i >= words.length) clearInterval(t); }, 110);
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.rate = 1; u.pitch = .95;
  const orb = $("#orb");
  u.onstart = () => orb.classList.add("speaking");
  u.onend = u.onerror = () => orb.classList.remove("speaking");
  u.onboundary = () => { orb.style.transform = `scale(${1 + Math.random() * .12})`; setTimeout(() => (orb.style.transform = ""), 90); };
  speechSynthesis.speak(u);
}
function answer(q) {
  const s = q.toLowerCase(), c = capsule;
  const pick = (val, intro, empty) => (val ? `${intro} ${val}` : empty);
  if (/worr|fear|scar|anx/.test(s)) return pick(c.worries, "Honestly? I was worried about this:", "I didn't write my worries down — maybe I was braver than I thought.");
  if (/hope|change|goal|want|achiev/.test(s)) return pick(c.goals, "I really hoped for this:", "I didn't name my goals — but I knew I wanted more.");
  if (/matter|value|important|care/.test(s)) return pick(c.values, "What mattered most to me was", "I think what mattered most was just getting through, and the people around me.");
  if (/become|future|person|who.*be/.test(s)) return pick(c.become, "I wanted to become", "I wasn't sure who I'd become. That's kind of the point.");
  if (/work|job|career|do for/.test(s)) return pick(c.work, "Back then I was working on", "I didn't say much about work.");
  if (/letter|dear|message|say to me/.test(s)) return pick(c.letter, "Here's what I wrote to you:", "I didn't finish the letter. This conversation is the letter.");
  if (/who|feel|today|then/.test(s)) return pick(c.transcript, "Here's what I said that day:", "I was right in the middle of it all.");
  return pick(c.transcript || c.letter, "I'm not sure about that one, but here's what I told you:", "I don't remember that — but I'm proud you're asking.");
}
function ask(q) {
  q = q.trim(); if (!q) return;
  bubble("me", q); $("#askInput").value = "";
  setTimeout(() => say(answer(q)), 400);
}
$("#askBtn").onclick = () => ask($("#askInput").value);
$("#askInput").onkeydown = (e) => e.key === "Enter" && ask(e.target.value);
$$("#presets .chip").forEach((c) => (c.onclick = () => ask(c.textContent)));
$("#askMic").onclick = () => {
  if (!SR) return alert("Voice input isn't supported in this browser — try Chrome.");
  const r = new SR(); r.lang = "en-US"; $("#askMic").classList.add("rec");
  r.onresult = (e) => ask(e.results[0][0].transcript);
  r.onend = () => $("#askMic").classList.remove("rec");
  r.start();
};

/* ---------- Milestones + Then vs Now ---------- */
function extract(text) {
  return text.split(/[.,;\n!]|\band\b/i).map((x) => x.trim()).filter((x) => x.split(" ").length >= 2)
    .map((x) => x.replace(/^(i|we)\s+/i, "").replace(/^\w/, (m) => m.toUpperCase()));
}
$("#extractBtn").onclick = () => {
  capsule.happened = $("#happened").value.trim(); capsule.milestones = extract(capsule.happened);
  store.set(capsule); renderCompare();
};
function renderCompare() {
  const c = capsule;
  $("#happened").value = c.happened || "";
  $("#milestones").innerHTML = "";
  (c.milestones || []).forEach((m, i) => {
    const li = document.createElement("li"); li.textContent = m; li.style.animationDelay = i * 120 + "ms"; $("#milestones").append(li);
  });
  const dl = (el, rows) => { $(el).innerHTML = ""; rows.forEach(([k, v]) => { $(el).insertAdjacentHTML("beforeend", "<dt></dt><dd></dd>"); $(el).lastElementChild.previousElementSibling.textContent = k; $(el).lastElementChild.textContent = v || "—"; }); };
  dl("#thenList", [["What I wanted", c.goals], ["What I feared", c.worries], ["What mattered", c.values]]);
  const ms = c.milestones || [];
  dl("#nowList", [["What I accomplished", ms.join(" · ")], ["What changed", c.happened], ["Who I'm becoming", c.become]]);
  const elapsed = c.sealedAt ? Math.max(0, Math.round((Date.now() - c.sealedAt) / 864e5)) : 0;
  $("#narrative").textContent = ms.length
    ? `${elapsed ? elapsed + " days" : "Since you sealed it"}, ${c.name || "you"} went from ${c.worries ? "worrying about “" + c.worries + "”" : "uncertainty"} to ${ms.length} real milestone${ms.length > 1 ? "s" : ""} — including “${ms[0]}”. ${c.become ? "You're becoming " + c.become + "." : ""}`
    : "Tell us what happened and we'll show your progression.";
}
$("#againBtn").onclick = () => {
  capsule = {}; store.set(capsule); talkInit = false;
  fields.forEach((f) => ($("#f-" + f).value = ""));
  $("#photoPreview").hidden = true; $("#photoHint").hidden = false; $("#playback").hidden = true;
  step = 0; showStep(); go("create");
};
