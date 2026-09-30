import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "subtle";
  size?: "md" | "lg";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
};

const variants = {
  primary:
    "bg-gradient-to-b from-gold-bright to-gold text-midnight shadow-[0_8px_30px_-8px_rgba(232,182,84,0.55)] hover:brightness-110 active:brightness-95",
  ghost:
    "border border-border-bright text-ink hover:border-gold/60 hover:text-gold-bright bg-transparent",
  subtle:
    "bg-midnight-3 text-muted hover:text-ink border border-border hover:border-border-bright",
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold font-body tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon && iconPosition === "left" ? icon : null}
      {children}
      {icon && iconPosition === "right" ? icon : null}
    </button>
  );
}
