import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-sm group">
      {label && (
        <label
          htmlFor={id}
          className="text-style-label text-text-secondary group-focus-within:text-text-display"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "bg-transparent border-0 border-b border-border-visible px-0 py-xs text-style-caption text-text-display placeholder:text-text-disabled focus:outline-none focus:border-text-display w-full",
          className
        )}
        {...props}
      />
    </div>
  );
}
