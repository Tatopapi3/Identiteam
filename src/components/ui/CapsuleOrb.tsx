import { LockIcon } from "./icons";

type OrbState = "idle" | "sealed" | "opening" | "open";

export function CapsuleOrb({
  state = "idle",
  size = 220,
}: {
  state?: OrbState;
  size?: number;
}) {
  const glowOpacity = state === "sealed" ? 0.35 : state === "opening" ? 1 : 0.7;

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size * 1.25 }}
    >
      <div
        className={`glow-breathe absolute inset-0 rounded-full blur-3xl transition-opacity duration-700`}
        style={{
          background:
            "radial-gradient(circle, rgba(232,182,84,0.55) 0%, rgba(232,182,84,0) 70%)",
          opacity: glowOpacity,
        }}
      />
      <svg
        viewBox="0 0 200 250"
        width={size}
        height={size * 1.25}
        className="relative drop-shadow-[0_0_35px_rgba(232,182,84,0.25)]"
      >
        <defs>
          <linearGradient id="capsuleBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a4576" />
            <stop offset="55%" stopColor="#1d2547" />
            <stop offset="100%" stopColor="#10152b" />
          </linearGradient>
          <linearGradient id="capsuleSheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f6d488" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f6d488" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect
          x="35"
          y="10"
          width="130"
          height="230"
          rx="65"
          fill="url(#capsuleBody)"
          stroke="#e8b654"
          strokeOpacity={state === "sealed" ? 0.5 : 0.8}
          strokeWidth="1.5"
        />
        <ellipse cx="75" cy="55" rx="28" ry="45" fill="url(#capsuleSheen)" />

        {/* seam ring */}
        <line
          x1="35"
          y1="125"
          x2="165"
          y2="125"
          stroke="#e8b654"
          strokeOpacity={state === "sealed" ? 0.6 : 0.3}
          strokeWidth="1.5"
          strokeDasharray="4 5"
        />

        {/* core light */}
        <circle
          cx="100"
          cy="125"
          r={state === "opening" ? 34 : 22}
          fill="#e8b654"
          opacity={state === "sealed" ? 0.25 : 0.85}
          className={state === "opening" ? "glow-breathe" : ""}
        />
        <circle cx="100" cy="125" r="10" fill="#fff8e7" opacity={state === "sealed" ? 0.2 : 0.9} />
      </svg>

      {state === "sealed" && (
        <div className="absolute bottom-6 flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-midnight text-gold shadow-[0_0_20px_-2px_rgba(232,182,84,0.5)]">
          <LockIcon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
