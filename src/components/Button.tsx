import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent" | "danger";
  loading?: boolean;
}

/**
 * Every state the brief asks for, in one place: hover/active are plain CSS
 * on .btn, focus-visible is the global custom ring, disabled dims and blocks
 * clicks, and loading shows a spinner + aria-busy without also disabling
 * (so the button still announces itself as "in progress", not "unavailable").
 */
export function Button({ variant = "default", loading, disabled, children, className, ...rest }: ButtonProps) {
  const variantClass = variant !== "default" ? `btn--${variant}` : "";
  return (
    <button
      className={["btn", variantClass, className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
