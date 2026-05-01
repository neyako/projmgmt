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
        "text-style-label uppercase tracking-widest active:opacity-80 flex items-center justify-center gap-sm whitespace-nowrap border",
        // Variants
        variant === "primary" &&
          "bg-text-display text-text-inverse border-text-display hover:bg-background hover:text-text-display",
        variant === "secondary" &&
          "bg-transparent border-border-visible text-text-display hover:bg-text-display hover:text-text-inverse hover:border-text-display",
        variant === "ghost" &&
          "bg-transparent border-transparent text-text-secondary hover:bg-text-display hover:text-text-inverse hover:border-text-display",
        variant === "danger" &&
          "bg-transparent border-accent/40 text-accent hover:bg-accent hover:text-text-inverse hover:border-accent",
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
