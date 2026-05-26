import { cn } from "@/lib/utils";
import {
  buttonStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/controlStyles";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
      className={cn(buttonStyles({ variant, size, pill }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
