import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  fieldLabelStyles,
  pickerChevronStyles,
  pickerStyles,
  type FieldSize,
  type FieldVariant,
} from "@/components/ui/controlStyles";

interface PickerProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: ReactNode;
  labelClassName?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  wrapperClassName?: string;
  chevronClassName?: string;
}

export function PickerChevron({
  variant = "underline",
  className,
}: {
  variant?: FieldVariant;
  className?: string;
}) {
  return (
    <svg
      className={pickerChevronStyles({ variant, className })}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export default function Picker({
  children,
  className,
  chevronClassName,
  id,
  label,
  labelClassName,
  size = "sm",
  variant = "underline",
  wrapperClassName,
  ...props
}: PickerProps) {
  const picker = (
    <div className={cn("relative", !label && wrapperClassName)}>
      <select
        id={id}
        className={pickerStyles({ variant, size, className })}
        {...props}
      >
        {children}
      </select>
      <PickerChevron variant={variant} className={chevronClassName} />
    </div>
  );

  if (!label) return picker;

  return (
    <div className={cn("flex flex-col gap-sm group", wrapperClassName)}>
      <label htmlFor={id} className={fieldLabelStyles(labelClassName)}>
        {label}
      </label>
      {picker}
    </div>
  );
}
