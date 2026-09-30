import type { ReactNode } from "react";

export function PageShell({
  children,
  eyebrow,
  wide = false,
}: {
  children: ReactNode;
  eyebrow?: string;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen midnight-gradient text-ink font-body">
      <div className="starfield" />
      <div
        className={`relative z-10 mx-auto flex min-h-screen flex-col px-6 py-14 ${
          wide ? "max-w-5xl" : "max-w-2xl"
        }`}
      >
        {eyebrow && (
          <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.25em] text-gold-dim drift-up">
            {eyebrow}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
