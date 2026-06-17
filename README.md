# Xikomu — Lucky Flip

> A coin-flip game on Celo. Pick a side, flip, win 1.95×. Cash out anytime.

Xikomu Lucky Flip is an on-chain game on **Celo Mainnet**: buy chips with **native CELO**, flip a coin (**Heads** or **Tails**), and win **1.95×** your bet. Every flip is **one on-chain transaction** — fast, fair, and fun. No token approval, no custody.

Built for **Celo** (Games / x-to-earn).

- 🎮 **Play:** https://xikomu.vercel.app
- 🔗 **Contract (verified):** [`0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd`](https://celoscan.io/address/0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd#code)

---

## Why it fits

- **A game, not custodial DeFi** — chips are game credits; the owner can **never** touch a player's chips, and **cash-out always works** (even when paused).
- **High on-chain activity by design** — 1 flip = 1 tx → real, organic transaction volume from real play.
- **Native CELO, zero approval** — chips are bought with `msg.value`, so there's no ERC-20 approval step. Plays in any injected wallet (incl. MiniPay) and on the web.
- **Cheap & snappy** — chips are an internal balance, so flips don't move tokens each round.

---

## How it works

```
Player (Web / injected wallet)
  │  buyCredits()  payable        → chips        (send CELO, no approval)
  │  flip(bet, Heads/Tails)       → win ~1.95× or lose (1 tx)
  │  cashOut(chips)               → CELO         (always available)
  ▼
XikomuFlip.sol  (Celo Mainnet, verified)
  houseLiquidity pool pays wins / absorbs losses
  owner can only top-up/withdraw the HOUSE, never player chips
```

A win pays **1.95×** (your stake back + 0.95× profit); a losing bet goes to the house
pool. The ~5% edge keeps the pool solvent so the game can keep running. Randomness is
on-chain entropy (low-stakes; bets capped by `MAX_BET`).

---

## Deployed (Celo Mainnet · 42220)

| What | Address |
|---|---|
| **XikomuFlip** (active, native CELO) | [`0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd`](https://celoscan.io/address/0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd#code) |

> Bets: min **0.01 CELO**, max **5 CELO**. Frontend reads the address from
> `NEXT_PUBLIC_FLIP_CELO`. Earlier ERC-20 builds (`0x82622F…`, `0x09EF08…`) are
> superseded by this native-CELO version.

---

## Stack

| Layer | Tech |
|---|---|
| Smart contract | Solidity 0.8.24 + **Foundry** + OpenZeppelin (`Ownable2Step`, `Pausable`, `ReentrancyGuard`) |
| Frontend | **Next.js 14** (App Router) + **wagmi v2 + viem** + Tailwind |
| Chain | Celo Mainnet (42220) · native **CELO** · testnet: Celo Sepolia (11142220) |
| Deploy | Vercel (frontend) · Celoscan (contract verify, Etherscan API V2) |

---

## Repo structure

```
xikomu/
├── contracts/        # Foundry: XikomuFlip.sol (game) + tests + deploy scripts
├── frontend/         # Next.js app: Lucky Flip landing + /app game
└── README.md
```

---

## Quickstart

```bash
# Smart contract
cd contracts && forge build && forge test            # 17 game tests, all green

# Frontend
cd frontend && npm install && npm run dev            # http://localhost:3000
```

Frontend env (`frontend/.env.local`):

```
NEXT_PUBLIC_FLIP_CELO=0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd
NEXT_PUBLIC_START_BLOCK=68997210
```

---

## Status

✅ **Live** — contract deployed & verified on Celo Mainnet, house funded, frontend on Vercel.


