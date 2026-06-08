# Xikomu — Lucky Flip

> A MiniPay coin-flip game on Celo. Pick a side, flip, win 1.95×. Cash out anytime.

Xikomu Lucky Flip is a **MiniPay mini-app** on Celo Mainnet: buy chips with **cUSD**, flip a coin (**Heads** or **Tails**), and win **1.95×** your bet. Every flip is **one on-chain transaction** — fast, fair, and fun.

Built for **Celo Proof of Ship Season 2** (Games / x-to-earn).

---

## Why it fits

- **A game, not custodial DeFi** — chips are game credits; the owner can **never** touch a player's chips, and **cash-out always works** (even when paused).
- **High on-chain activity by design** — 1 flip = 1 tx → real, organic transaction volume from real play.
- **MiniPay-native** — runs inside the Opera MiniPay wallet (auto-connect), plus a web view.
- **Cheap & snappy** — chips are an internal balance, so flips don't need a token transfer each round.

---

## How it works

```
Player (MiniPay / Web)
  │  buyCredits(cUSD)            → chips
  │  flip(bet, Heads/Tails)      → win ~1.95× or lose (1 tx)
  │  cashOut(chips)              → cUSD  (always available)
  ▼
XikomuFlip.sol  (Celo Mainnet, verified)
  houseLiquidity pool pays wins / absorbs losses
  owner can only top-up/withdraw the HOUSE, never player chips
```

Full spec (contract interface, randomness notes, screens, milestones) is in **[PRD.md](./PRD.md)**.

---

## Stack

| Layer | Tech |
|---|---|
| Smart contract | Solidity 0.8.24 + **Foundry** + OpenZeppelin |
| Frontend | **Next.js 14** (App Router) + **wagmi v2 + viem** + Tailwind |
| Chain | Celo Mainnet (42220) · token: **cUSD** · testnet: Celo Sepolia (11142220) |
| Deploy | Vercel (frontend) · Celoscan (contract verify) |

---

## Repo structure

```
xikomu/
├── contracts/        # Foundry: XikomuFlip.sol (game) + tests + deploy scripts
├── frontend/         # Next.js MiniPay app: landing + /app game
└── README.md · PRD.md
```

> Legacy: `contracts/src/AutoSaveVault.sol` and `keeper/` are from an earlier
> auto-save concept and are **superseded** by the game. They remain for history.

---

## Quickstart

```bash
# Smart contract
cd contracts && forge build && forge test            # 17 game tests

# Frontend
cd frontend && npm install && npm run dev            # http://localhost:3000
```

---

## Status

🚧 In development — targeting Celo **Mainnet** deploy before 22 Jun 2026.

## License

MIT (open source — Proof of Ship requirement).
