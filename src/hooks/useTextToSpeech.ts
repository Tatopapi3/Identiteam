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

  const speak = useCallback(
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

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return { supported, isSpeaking, speak, stop };
}
