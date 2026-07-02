"use client";

import { useEffect, useRef } from "react";

export type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms. Set to 0 to disable. Default: 4000 */
  duration?: number;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-green-600 text-white",
  error:   "bg-red-600   text-white",
  info:    "bg-gray-800  text-white",
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: "✅",
  error:   "❌",
  info:    "ℹ️",
};

export default function Toast({
  message,
  variant = "success",
  duration = 4000,
  onDismiss,
}: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(onDismiss, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                  flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl
                  text-sm font-medium max-w-sm w-full
                  animate-in fade-in slide-in-from-bottom-4 duration-300
                  ${VARIANT_STYLES[variant]}`}
    >
      <span aria-hidden="true" className="text-base shrink-0">
        {VARIANT_ICONS[variant]}
      </span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-2 shrink-0 opacity-80 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}
