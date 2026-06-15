"use client";

import type { ReactNode } from "react";

// The three in-app surfaces shown after Launch App. Shared by the Celo and
// Stacks game shells so both chains get the same Home / Profile / Riwayat nav.
export type Tab = "home" | "profile" | "riwayat";

const ITEMS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "profile", label: "Profile", icon: <UserIcon /> },
  { id: "riwayat", label: "Riwayat", icon: <HistoryIcon /> },
];

/** Bottom tab bar (orange active state) for the in-app Home/Profile/Riwayat views. */
export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-stone-200/70 bg-[#FAFAF8]/90 backdrop-blur-md">
      <div className="max-w-2xl mx-auto px-4 flex items-stretch justify-around">
        {ITEMS.map((it) => {
          const on = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              aria-current={on ? "page" : undefined}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                on ? "text-[#FF5E00]" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <span
                className={`flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
                  on ? "bg-[#FF5E00]/10" : ""
                }`}
              >
                {it.icon}
              </span>
              <span className="text-[11px] font-medium">{it.label}</span>
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
