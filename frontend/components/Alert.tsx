"use client";

import type { ReactNode } from "react";

export type AlertVariant = "error" | "warning" | "info" | "success";

const STYLES: Record<AlertVariant, { box: string; dot: string }> = {
  error: { box: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  info: { box: "border-sky-200 bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
};

/**
 * Dismissible inline alert (role="alert"). Used to surface tx failures,
 * insufficient-funds warnings, and pending states clearly instead of a tiny
 * line of red text.
 */
export function Alert({
  variant = "error",
  title,
  children,
  onClose,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
}) {
  const s = STYLES[variant];
  return (
    <div role="alert" className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${s.box}`}>
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} aria-hidden />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-sm">{title}</p>}
        {children && <p className="text-sm font-light opacity-90 mt-0.5 break-words">{children}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 -mr-1 -mt-0.5 w-7 h-7 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
