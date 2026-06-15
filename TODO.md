# Xikomu — Landing visual to-do

The landing **copy** is already on-brand for the coin-flip game (Heads/Tails,
bet, 1.95×, cash out). What still needs work is **imagery**: the visuals are
leftover placeholders from the original "Casa Flow" template
(`frontend/components/landingHtml.ts` even says so on line 3 —
*"IMAGE elements and animations are kept verbatim as placeholders"*).

Replace these so the visuals match the game, keeping the existing orange theme
(`#FF5E00`). All references below are in `frontend/components/landingHtml.ts`
unless noted.

## High priority

- [ ] **Hero "Architectural Pattern" SVG** (lines ~52–99) — isometric cubes from
      the real-estate template, not a coin. Replace with a Xikomu coin visual
      (reuse the `Coin` Heads/Tails look from `components/CeloFlip.tsx`).
- [ ] **Parallax gallery — 13 stock photos** (lines ~183–195, `alt="Placeholder"`)
      — random Unsplash images in the dark section. Swap for coin / win / chip
      imagery, or replace the photos with Heads/Tails coin cards + payout numbers.

## Medium priority

- [ ] **"Live Payout" mockup avatars** (lines ~240 & 246) — random face/object
      photos beside "Heads · Win" / "Tails · Win". Replace with Heads (orange) /
      Tails (gray) coin icons.
- [ ] **FAQ card backgrounds — 3 photos** (lines ~336, 343, 350) — random
      Unsplash backdrops behind the FAQ flip cards. Replace with coin imagery or
      a solid brand gradient.

## Assets (`frontend/public/`)

- [ ] Confirm `logo.png` (11 KB, used in nav + footer) is the correct Xikomu logo.
- [ ] **Delete `logo-xikomu1.png` (1.9 MB)** — not referenced anywhere; dead weight.
- [ ] Confirm `frontend/app/icon.png` (favicon) is the Xikomu coin icon.

## Already correct — no change needed

- Hero/CTA/FAQ copy, trust marquee, the three feature cards, footer — all
  flip-themed and on-brand.
