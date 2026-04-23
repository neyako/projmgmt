import { cn } from "@/lib/utils";

interface StatusDotProps {
  color?: "success" | "warning" | "accent" | "interactive" | "disabled";
  pulse?: boolean;
  size?: "sm" | "md";
}

const colorMap = {
  success: "bg-success",
  warning: "bg-warning",
  accent: "bg-accent",
  interactive: "bg-interactive",
  disabled: "bg-surface-raised border border-border-visible",
};

export default function StatusDot({
  color = "success",
  pulse = false,
  size = "sm",
}: StatusDotProps) {
  return (
    <div
      className={cn(
        "rounded-full",
        size === "sm" ? "w-2 h-2" : "w-3 h-3",
        colorMap[color],
        pulse && "animate-pulse"
      )}
    />
  );
}
