import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED_VOICE_NAMES = [
  "Samantha", // macOS — warm, widely regarded as the nicest built-in voice
  "Google UK English Female",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Karen",
  "Moira",
  "Serena",
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  for (const name of PREFERRED_VOICE_NAMES) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  const englishFemale = voices.find(
    (v) => v.lang.startsWith("en") && /female|zira|jenny|samantha|karen/i.test(v.name),
  );
  if (englishFemale) return englishFemale;
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
}

/**
 * Thin wrapper around the browser's SpeechSynthesis API — the MVP's
 * text-to-speech path for the past-self's spoken replies. No server round
 * trip, no API key; degrades gracefully (text still renders) if the
 * browser has no voices available.
 */
export function useTextToSpeech() {
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef(0);

  const speakBrowser = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number }) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(voicesRef.current);
      if (voice) utterance.voice = voice;
      utterance.rate = opts?.rate ?? 0.96;
      utterance.pitch = opts?.pitch ?? 1.03;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  const playUrl = useCallback((url: string) => {
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    return audio.play();
  }, []);

  /**
   * Speak in the past self's cloned voice when possible:
   * a pre-recorded clip if given, else live Comfy Cloud TTS (/api/tts),
   * else the browser voice. Returns a URL to reuse for replay, if any.
   */
  const speak = useCallback(
    async (text: string, opts?: { clip?: string; rate?: number; pitch?: number }): Promise<string | undefined> => {
      if (!text.trim()) return;
      const id = ++requestRef.current;
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      if (opts?.clip) {
        try {
          await playUrl(opts.clip);
          return opts.clip;
        } catch {
          /* fall through */
        }
      }
      setIsSpeaking(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("no live voice");
        const url = URL.createObjectURL(await res.blob());
        if (id !== requestRef.current) return url; // a newer request took over
        await playUrl(url);
        return url;
      } catch {
        if (id !== requestRef.current) return;
        setIsSpeaking(false);
        speakBrowser(text, opts);
      }
    },
    [playUrl, speakBrowser],
  );

  const stop = useCallback(() => {
    requestRef.current++;
    audioRef.current?.pause();
    if (supported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return { supported, isSpeaking, speak, stop };
}
