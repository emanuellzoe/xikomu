# Xikomu — Frontend

> MiniPay mini-app for **Xikomu Lucky Flip**: a cUSD coin-flip game on Celo.

Next.js (App Router) frontend with two surfaces:
- **Landing (`/`)** — marketing page, Claude-orange theme.
- **Game (`/app`)** — connect wallet, buy chips, flip **Heads (orange)** / **Tails (gray)**, win 1.95×, cash out anytime, recent flips.

Backend = `XikomuFlip` smart contract (repo: [`xikomu`](https://github.com/emanuellzoe/xikomu) `contracts/`).

## Stack
Next.js 14 · TypeScript · wagmi v2 + viem · Tailwind · Vercel · Celo (Mainnet 42220 + Celo Sepolia 11142220).

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```

## Config (after contract deploy)
Create `.env.local`:
```bash
NEXT_PUBLIC_FLIP_CELO=0x...          # XikomuFlip on mainnet
NEXT_PUBLIC_START_BLOCK=<deploy block>
# testnet (optional):
# NEXT_PUBLIC_FLIP_SEPOLIA=0x...
# NEXT_PUBLIC_CUSD_SEPOLIA=0x...     # TestUSD on Sepolia
```

## Docs
Full spec in [PRD.md](./PRD.md) and the repo root [PRD.md](../PRD.md).

## License
MIT
