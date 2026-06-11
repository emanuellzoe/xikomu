# Xikomu — Frontend

> Mini-app for **Xikomu Lucky Flip** — a coin-flip game, now **multi-chain**.

Next.js (App Router) frontend with two surfaces:
- **Landing (`/`)** — marketing page, Claude-orange theme.
- **Game (`/app`)** — one page, a header **Celo / Stacks** toggle picks the chain:
  - **Celo** — wagmi + viem; native-CELO flip, MiniPay-ready.
  - **Stacks** — `@stacks/connect` (Xverse/Leather); native-STX flip against the
    `xikomu-flip` **Clarity** contract on Stacks testnet.

Both engines sit behind the same UI (animated coin, Heads/Tails, win 1.95×, buy
chips, cash out, recent flips) over the same rules — one on Solidity/Celo, one on
Clarity/Stacks. One deploy, one URL.

Backends: `XikomuFlip` (Solidity, `contracts/`) and `xikomu-flip` (Clarity,
`stacks-contracts/`).

## Stack
Next.js 14 · TypeScript · Tailwind · Vercel.
- **Celo:** wagmi v2 + viem · Celo Mainnet 42220 + Celo Sepolia 11142220.
- **Stacks:** @stacks/connect + @stacks/transactions · Stacks testnet.

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```

## Config (after contract deploy)
Create `.env.local` (see [`.env.example`](./.env.example)):
```bash
# Celo (/app)
NEXT_PUBLIC_FLIP_CELO=0x...          # XikomuFlip on mainnet
NEXT_PUBLIC_START_BLOCK=<deploy block>

# Stacks (/stacks)
NEXT_PUBLIC_STX_FLIP_ADDRESS=ST20RVFS6R3ZXJ01NZVV3FHKTQXRG4NY3WMQYWZK2
NEXT_PUBLIC_STX_FLIP_NAME=xikomu-flip
```

## Docs
Full spec in [PRD.md](./PRD.md) and the repo root [PRD.md](../PRD.md).

## License
MIT
