export function Waveform({ active = false, bars = 7 }: { active?: boolean; bars?: number }) {
  return (
    <div className={`waveform ${active ? "" : "idle"}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
