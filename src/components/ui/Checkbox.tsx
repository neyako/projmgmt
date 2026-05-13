import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: "sm" | "md";
}

export default function Checkbox({
  checked,
  onChange,
  label,
  size = "md",
}: CheckboxProps) {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const iconSize = size === "sm" ? "text-[10px]" : "text-[12px]";

  return (
    <label className="flex items-start gap-sm cursor-pointer group hover:bg-text-display hover:text-text-inverse">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex-shrink-0 border flex items-center justify-center",
          sizeClass,
          checked
            ? "bg-text-primary border-text-secondary group-hover:bg-text-inverse group-hover:border-text-inverse"
            : "bg-surface border-border-visible group-hover:border-text-inverse"
        )}
      >
        {checked && (
          <span
            className={cn("material-symbols-outlined text-text-inverse group-hover:text-text-display", iconSize)}
            style={{ fontVariationSettings: "'wght' 700" }}
          >
            check
          </span>
        )}
      </button>
      {label && (
        <span
          className={cn(
            "text-style-body-sm",
            checked
              ? "text-text-secondary line-through"
              : "text-text-primary group-hover:text-text-inverse"
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}
