import { cn } from "@/lib/utils";
import {
  fieldLabelStyles,
  inputStyles,
  type FieldSize,
  type FieldVariant,
} from "@/components/ui/controlStyles";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode;
  labelClassName?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  wrapperClassName?: string;
}

export default function Input({
  label,
  labelClassName,
  size = "md",
  variant = "underline",
  wrapperClassName,
  className,
  id,
  type,
  ...props
}: InputProps) {
  const input = (
    <input
      id={id}
      type={type}
      className={inputStyles({
        variant,
        size,
        nativePicker: type === "date" || type === "datetime-local" || type === "month" || type === "time",
        className,
      })}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <div className={cn("flex flex-col gap-sm group", wrapperClassName)}>
      <label htmlFor={id} className={fieldLabelStyles(labelClassName)}>
        {label}
      </label>
      {input}
    </div>
  );
}
