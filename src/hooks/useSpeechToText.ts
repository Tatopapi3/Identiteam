import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type UseSpeechToTextOptions = {
  /** Called every time the accumulated final transcript changes. */
  onFinalChunk?: (chunk: string) => void;
};

/**
 * Thin wrapper around the browser's Web Speech API (SpeechRecognition).
 * This is the MVP's speech-to-text path — no server round trip, works
 * offline-ish, and degrades to a visible "not supported, type instead"
 * state in browsers without it (notably Firefox/Safari as of this build).
 *
 * Whatever is still "interim" (not yet finalized by the engine) at the
 * moment recording stops — by the user clicking stop, or the browser
 * ending the session on its own after a pause — is promoted into the
 * final transcript rather than discarded. Without this, the last few
 * words of an answer could be silently dropped: captured in the UI while
 * listening, then gone the moment the mic turns off, so the capsule
 * would later "remember" less than the person actually said.
 */
export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const onFinalChunkRef = useRef(options.onFinalChunk);
  onFinalChunkRef.current = options.onFinalChunk;

  const commitInterim = useCallback(() => {
    if (!interimRef.current) return;
    finalRef.current = [finalRef.current, interimRef.current].filter(Boolean).join(" ").trim();
    onFinalChunkRef.current?.(interimRef.current.trim());
    interimRef.current = "";
    setTranscript(finalRef.current);
    setInterim("");
  }, []);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${text}`.trim();
          onFinalChunkRef.current?.(text.trim());
        } else {
          interimText += text;
        }
      }
      interimRef.current = interimText;
      setTranscript(finalRef.current);
      setInterim(interimText);
    };

    recognition.onerror = () => {
      commitInterim();
      setIsListening(false);
    };

    recognition.onend = () => {
      // The engine can end the session on its own (e.g. after a pause) —
      // not only when our stop() wrapper calls it — so whatever is still
      // interim at that point is committed here too, not just in stop().
      commitInterim();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.abort();
    };
  }, [commitInterim]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    finalRef.current = transcript;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // already started — ignore
    }
  }, [transcript]);

  const stop = useCallback(() => {
    commitInterim();
    recognitionRef.current?.stop();
    setIsListening(false);
  }, [commitInterim]);

  const reset = useCallback(() => {
    finalRef.current = "";
    interimRef.current = "";
    setTranscript("");
    setInterim("");
  }, []);

  const setText = useCallback((text: string) => {
    finalRef.current = text;
    setTranscript(text);
  }, []);

  return {
    supported,
    isListening,
    transcript,
    interim,
    start,
    stop,
    reset,
    setText,
  };
}
