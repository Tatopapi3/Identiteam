import { MicIcon, StopIcon } from "./icons";

export function MicButton({
  isListening,
  onClick,
  disabled,
  size = "lg",
}: {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const dims = size === "lg" ? "w-20 h-20" : "w-14 h-14";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? "Stop recording" : "Start recording"}
      className="relative flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed group"
    >
      {isListening && (
        <>
          <span className="mic-ring absolute inset-0 rounded-full border-2 border-gold" />
          <span
            className="mic-ring absolute inset-0 rounded-full border-2 border-gold"
            style={{ animationDelay: "0.6s" }}
          />
        </>
      )}
      <span
        className={`relative ${dims} rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening
            ? "bg-gold text-midnight shadow-[0_0_40px_-4px_rgba(232,182,84,0.7)]"
            : "bg-midnight-3 text-gold border border-border-bright group-hover:border-gold/60 group-hover:text-gold-bright"
        }`}
      >
        {isListening ? <StopIcon className="w-7 h-7" /> : <MicIcon className="w-7 h-7" />}
      </span>
    </button>
  );
}
