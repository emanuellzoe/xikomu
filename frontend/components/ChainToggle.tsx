"use client";

export type Chain = "celo" | "stacks";

/** Segmented Celo / Stacks switch shown in the game header. */
export function ChainToggle({ value, onChange }: { value: Chain; onChange: (c: Chain) => void }) {
  return (
    <div className="inline-flex items-center rounded-full bg-stone-100 p-0.5 text-xs font-medium">
      {(["celo", "stacks"] as Chain[]).map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-2.5 py-1 rounded-full transition-colors ${
            value === c ? "bg-white text-[#2C2B29] shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          {c === "celo" ? "Celo" : "Stacks"}
        </button>
      ))}
    </div>
  );
}
