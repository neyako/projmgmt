import { cn } from "@/lib/utils";

type WordmarkProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  weight?: 700 | 900;
  className?: string;
  showCursor?: boolean;
  cursorBlink?: boolean;
  as?: "span" | "h1" | "h2" | "div";
};

const wordmarkSize: Record<NonNullable<WordmarkProps["size"]>, string> = {
  xs: "text-[14px]",
  sm: "text-[18px]",
  md: "text-[22px]",
  lg: "text-[44px]",
  xl: "text-[clamp(40px,12vw,132px)]",
};

export function Wordmark({
  size = "md",
  weight = 700,
  className,
  showCursor = true,
  cursorBlink = false,
  as: Tag = "span",
}: WordmarkProps) {
  return (
    <Tag
      className={cn(
        "font-[family-name:var(--font-logo)] lowercase leading-[0.92] text-text-display select-none whitespace-nowrap",
        weight === 900 ? "font-black" : "font-bold",
        wordmarkSize[size],
        className,
      )}
      style={{ letterSpacing: "-0.04em" }}
      aria-label="projmgmt"
    >
      projmgmt
      {showCursor && (
        <span
          className={cn("text-accent", cursorBlink && "logo-cursor-blink")}
          aria-hidden="true"
        >
          _
        </span>
      )}
    </Tag>
  );
}

type MonogramVariant = "outline" | "solid" | "signal" | "ghost";
type MonogramProps = {
  variant?: MonogramVariant;
  size?: number;
  className?: string;
};

export function Monogram({
  variant = "outline",
  size = 32,
  className,
}: MonogramProps) {
  const variants: Record<MonogramVariant, string> = {
    outline:
      "bg-surface text-text-display border border-border-visible",
    solid:
      "bg-text-display text-text-inverse border border-text-display",
    signal:
      "bg-accent text-text-inverse border border-accent",
    ghost:
      "bg-transparent text-text-display border border-border-visible",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-[family-name:var(--font-logo)] font-bold leading-none",
        variants[variant],
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        letterSpacing: "-0.04em",
      }}
      aria-label="projmgmt monogram"
    >
      <span aria-hidden="true">p</span>
      <span aria-hidden="true" className="text-accent" style={{ marginLeft: 1 }}>
        _
      </span>
    </span>
  );
}

export default Wordmark;
