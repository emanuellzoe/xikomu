# PRD — Xikomu Frontend (Lucky Flip)

**Status:** v1 (MVP) · **Location:** `frontend/` (in the `xikomu` monorepo) · **Backend:** `XikomuFlip` (`contracts/`)

> Frontend source of truth. See the repo root [PRD.md](../PRD.md) for the full product/contract spec.

---

## 1. Summary
The MiniPay UI for **Xikomu Lucky Flip**: buy chips with cUSD, flip Heads/Tails (1 tx, 1.95× on a win), cash out anytime. Two surfaces (web + MiniPay mobile), keep it simple and snappy.

## 2. Surfaces & screens
- **Landing (`/`)** — marketing page, Claude-orange theme. ⚠️ copy being migrated from the old auto-save template to the game.
- **Game (`/app`)**:
  1. **Connect** — auto-connect in MiniPay; manual connect on web; wrong-network → switch (Celo / Celo Sepolia).
  2. **Coin** — Heads = **orange**, Tails = **gray**, animated spin; lands on the result.
  3. **Play** — pick side + bet (cUSD quick-picks) → **Flip** → win/lose decoded from the `Flipped` event.
  4. **Chips** — buy (approve + `buyCredits`) and **Cash out** (always available).
  5. **Recent flips** — from on-chain events; balances for chips / wallet / house.

## 3. Tech
Next.js 14 (App Router) · wagmi v2 + viem · Tailwind. Providers in `app/providers.tsx`; chains in `lib/wagmi.ts`; addresses + ABIs in `lib/contracts.ts`.

## 4. Contract integration
- **Reads**: `chips(user)`, `houseLiquidity()`, cUSD `balanceOf`/`allowance`.
- **Writes**: cUSD `approve`, `buyCredits`, `flip(bet, choiceHeads)`, `cashOut`.
- **Events**: `Flipped` (result + history).
- **Addresses** (env): `NEXT_PUBLIC_FLIP_CELO` / `_SEPOLIA`, `NEXT_PUBLIC_CUSD_SEPOLIA` (TestUSD), `NEXT_PUBLIC_START_BLOCK`.
- Min/Max bet mirror the contract: 0.01 / 5 cUSD.

## 5. MiniPay
Detect `window.ethereum.isMiniPay` → auto-connect injected connector; hide connect UI; mobile-first, 1-tap flips.

## 6. Definition of done (v1)
- [ ] Live on Vercel, playable in MiniPay & web against the mainnet contract
- [ ] Flip / buy / cash out / history all work; coin animation + result
- [ ] Contract address + start block configured via env
