import { cn } from "@/lib/utils";

interface TagProps {
  label: string;
  color?: string;
  borderColor?: string;
  bgColor?: string;
  disabled?: boolean;
}

export default function Tag({
  label,
  color,
  borderColor,
  bgColor,
  disabled = false,
}: TagProps) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-label)] text-[9px] uppercase px-2 py-[2px] border inline-block",
        disabled
          ? "border-border text-text-secondary opacity-40 line-through cursor-not-allowed"
          : "cursor-default"
      )}
      style={
        !disabled
          ? {
              color: color || "var(--color-text-secondary)",
              borderColor: borderColor || "var(--color-border-visible)",
              backgroundColor: bgColor || "transparent",
            }
          : undefined
      }
    >
      {label}
    </span>
  );
}
