import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-border bg-midnight-2/80 backdrop-blur-sm ${className}`}
      {...rest}
    />
  );
}
