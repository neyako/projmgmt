import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type FieldVariant = "underline" | "panel";
export type FieldSize = "sm" | "md";

export function buttonStyles({
  variant = "primary",
  size = "md",
  pill = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  className?: string;
} = {}) {
  return cn(
    "text-style-label uppercase tracking-widest active:opacity-80 inline-flex items-center justify-center gap-sm whitespace-nowrap border disabled:opacity-50 disabled:cursor-not-allowed",
    variant === "primary" &&
      "bg-text-display text-text-inverse border-text-display hover:bg-background hover:text-text-display",
    (variant === "secondary" || variant === "outline") &&
      "bg-transparent border-border-visible text-text-display hover:bg-text-display hover:text-text-inverse hover:border-text-display",
    variant === "ghost" &&
      "bg-transparent border-transparent text-text-secondary hover:bg-text-display hover:text-text-inverse hover:border-text-display",
    variant === "danger" &&
      "bg-transparent border-accent/40 text-accent hover:bg-accent-subtle",
    size === "sm" && "px-3 py-1 text-[10px]",
    size === "md" && "px-md py-sm",
    size === "lg" && "px-xl py-md",
    pill ? "rounded-full" : "rounded-none",
    className
  );
}

export function fieldLabelStyles(className?: string) {
  return cn(
    "text-style-label text-text-secondary tracking-widest group-focus-within:text-text-display",
    className
  );
}

export function inputStyles({
  variant = "underline",
  size = "md",
  nativePicker = false,
  className,
}: {
  variant?: FieldVariant;
  size?: FieldSize;
  nativePicker?: boolean;
  className?: string;
} = {}) {
  return cn(
    "w-full text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display disabled:opacity-50 disabled:cursor-not-allowed",
    variant === "underline" &&
      "bg-transparent border-0 border-b border-border-visible px-0 font-mono",
    variant === "panel" && "ui-input",
    variant === "underline" && size === "sm" && "pb-2 pt-1 text-xs",
    variant === "underline" && size === "md" && "py-xs text-style-caption",
    variant === "panel" && size === "sm" && "p-2 text-xs uppercase tracking-widest",
    variant === "panel" && size === "md" && "p-2 text-xs",
    nativePicker && "color-scheme-dark",
    className
  );
}

export function pickerStyles({
  variant = "underline",
  size = "sm",
  className,
}: {
  variant?: FieldVariant;
  size?: FieldSize;
  className?: string;
} = {}) {
  return cn(
    inputStyles({ variant, size }),
    "appearance-none cursor-pointer pr-6 uppercase",
    className
  );
}

export function pickerChevronStyles({
  variant = "underline",
  className,
}: {
  variant?: FieldVariant;
  className?: string;
} = {}) {
  return cn(
    "pointer-events-none absolute w-3 h-3 text-text-secondary",
    variant === "underline" && "right-0 bottom-2",
    variant === "panel" && "right-2 top-1/2 -translate-y-1/2",
    className
  );
}
