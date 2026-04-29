"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

// ─── TYPES ──────────────────────────────────────────────
interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "warning";
}

interface ToastContextType {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ─── PROVIDER ───────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const t = useT();

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "error") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — fixed bottom-right */}
      <div className="fixed bottom-xl right-xl z-[9999] flex flex-col gap-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto px-lg py-md border flex items-start gap-sm min-w-[320px] max-w-[420px] animate-[slideIn_200ms_ease-out]",
              toast.type === "error" &&
                "bg-surface border-accent/40 text-text-display",
              toast.type === "success" &&
                "bg-surface border-success/40 text-text-display",
              toast.type === "warning" &&
                "bg-surface border-warning/40 text-text-display"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[16px] mt-[2px] flex-shrink-0",
                toast.type === "error" && "text-accent",
                toast.type === "success" && "text-success",
                toast.type === "warning" && "text-warning"
              )}
            >
              {toast.type === "error"
                ? "error"
                : toast.type === "success"
                  ? "check_circle"
                  : "warning"}
            </span>
            <div className="flex flex-col gap-xs flex-1">
              <span className="text-style-label text-text-secondary">
                {toast.type === "error"
                  ? t("toast.error")
                  : toast.type === "success"
                    ? t("toast.ok")
                    : t("toast.warn")}
              </span>
              <span className="text-style-body-sm text-text-primary">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="text-text-secondary hover:text-text-display transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[14px]">
                close
              </span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
