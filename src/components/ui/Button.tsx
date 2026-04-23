import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  pill = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "text-style-label uppercase tracking-widest transition-colors duration-200 active:opacity-80 flex items-center justify-center gap-sm whitespace-nowrap",
        // Variants
        variant === "primary" &&
          "bg-text-display text-black hover:bg-text-primary",
        variant === "secondary" &&
          "bg-transparent border border-border-visible text-text-display hover:bg-surface-raised",
        variant === "ghost" &&
          "bg-transparent text-text-secondary hover:text-text-display",
        variant === "danger" &&
          "bg-accent text-white hover:opacity-90",
        // Sizes
        size === "sm" && "px-3 py-1 text-[10px]",
        size === "md" && "px-md py-sm",
        size === "lg" && "px-xl py-md",
        // Shape
        pill ? "rounded-full" : "rounded-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
