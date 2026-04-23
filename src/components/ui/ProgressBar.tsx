import { cn } from "@/lib/utils";

interface ProgressBarProps {
  total: number;
  filled: number;
  height?: string;
  filledColor?: string;
  emptyColor?: string;
}

export default function ProgressBar({
  total,
  filled,
  height = "h-[4px]",
  filledColor = "bg-text-primary",
  emptyColor = "bg-surface-variant",
}: ProgressBarProps) {
  return (
    <div className={cn("flex gap-[2px]", height)}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn("flex-1", i < filled ? filledColor : emptyColor)}
        />
      ))}
    </div>
  );
}
