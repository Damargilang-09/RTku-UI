import { cn } from "@/src/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-surface-tertiary text-text-primary hover:bg-border",
  success: "bg-secondary text-white hover:bg-secondary-dark",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-primary hover:bg-primary-light",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          VARIANT_CLASSES[variant],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && (
          <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
