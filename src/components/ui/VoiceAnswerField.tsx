import { useEffect, useRef } from "react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { MicButton } from "./MicButton";
import { Waveform } from "./Waveform";

export function VoiceAnswerField({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const { supported, isListening, transcript, interim, start, stop, reset } =
    useSpeechToText();
  const baseRef = useRef("");

  useEffect(() => {
    if (!transcript) return;
    const combined = [baseRef.current, transcript].filter(Boolean).join(" ");
    onChange(combined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  function handleMicClick() {
    if (isListening) {
      stop();
    } else {
      baseRef.current = value;
      reset();
      start();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <MicButton isListening={isListening} onClick={handleMicClick} size="md" />
        <div className="flex-1">
          <Waveform active={isListening} />
          <p className="mt-1 text-xs text-muted">
            {!supported
              ? "Voice input isn't available in this browser — type your answer below."
              : isListening
                ? "Listening… press again to stop."
                : "Press the mic and speak, or type below."}
          </p>
        </div>
      </div>

      {isListening && interim && (
        <p className="italic text-muted text-sm -mb-2">{interim}</p>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-border bg-midnight-3/70 px-4 py-3 font-body text-ink placeholder:text-faint focus:border-gold/50 focus:outline-none"
      />
    </div>
  );
}
