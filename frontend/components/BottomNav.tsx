"use client";

import type { ReactNode } from "react";

// The three in-app surfaces shown after Launch App: the Celo game shell uses
// these for the same Home / Profile / Riwayat nav.
export type Tab = "home" | "profile" | "riwayat";

const ITEMS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "profile", label: "Profile", icon: <UserIcon /> },
  { id: "riwayat", label: "Riwayat", icon: <HistoryIcon /> },
];

/**
 * Floating, icon-only, oval nav (transparent + blurred).
 * - Mobile: a horizontal pill pinned bottom-center.
 * - Desktop (lg+): a vertical pill pinned to the left, vertically centered.
 * Orange filled circle marks the active tab. Labels live in aria-label / title.
 */
export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed z-50 bottom-5 left-1/2 -translate-x-1/2 lg:bottom-auto lg:left-5 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2"
    >
      <div className="flex flex-row lg:flex-col gap-1 p-1.5 rounded-full border border-white/40 bg-white/40 backdrop-blur-xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.3)]">
        {ITEMS.map((it) => {
          const on = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              aria-label={it.label}
              aria-current={on ? "page" : undefined}
              title={it.label}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
                on
                  ? "bg-[#FF5E00] text-white shadow-[0_4px_14px_rgba(255,94,0,0.45)]"
                  : "text-stone-500 hover:text-stone-800 hover:bg-white/60"
              }`}
            >
              {it.icon}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- icons (stroke = currentColor, so the active orange flows through) ---------- */
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
