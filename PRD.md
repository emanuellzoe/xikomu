# PRD — Xikomu Lucky Flip

**Status:** v1 (MVP) · **Target:** Celo Proof of Ship S2 · **Deploy:** Celo **Mainnet** (direct)

> Source of truth. Follow this when coding; don't add scope beyond "v1 (MVP)" without updating the PRD. Values marked `⚠️ VERIFY` must be confirmed from an authoritative source before use.

---

## 1. Summary
A MiniPay coin-flip game on Celo. Players buy **chips** with **cUSD** (1:1), bet on **Heads/Tails**, and each **flip is one on-chain tx** paying **1.95×** on a win. Chips cash back to cUSD anytime.

**Category:** Game / x-to-earn (deliberately NOT custodial DeFi — chips are game credits, owner can't touch them, cash-out always works).

---

## 2. Goals & non-goals
### Goals (v1)
1. `XikomuFlip` deployed & **verified** on Celo Mainnet, house pool funded.
2. Next.js MiniPay app: connect, buy chips, flip (Heads/Tails), cash out, history.
3. Real on-chain flips from real players (tx volume + DAU).
4. Registered on talent.app + Proof of Ship campaign.

### Non-goals (v1)
- Multiplayer / PvP, jackpots, leaderboards (v2)
- Multi-token (cUSD only)
- Backend/indexer (history read from events)
- VRF/oracle randomness (v1 uses on-chain entropy, low-stakes — see §4.4)
- The legacy auto-save vault + keeper (superseded; left in repo for history)

---

## 3. Chain constants
| Item | Value |
|---|---|
| Celo Mainnet chainId | `42220` |
| Celo Mainnet RPC | `https://forno.celo.org` |
| Explorer | Celoscan `https://celoscan.io` |
| **cUSD (mainnet)** | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Testnet | Celo Sepolia `11142220`, RPC `https://forno.celo-sepolia.celo-testnet.org`, explorer `https://sepolia.celoscan.io`; uses a deployed TestUSD as the chip token |

---

## 4. Smart contract — `XikomuFlip.sol` (built)

### 4.1 Principles
- **Immutable / non-upgradeable**, game-credit model (not a savings vault).
- **No unbounded loops**; `flip()` is O(1) with **no external calls**.
- **CEI + ReentrancyGuard + SafeERC20**, custom errors, events for history.
- **Owner power is minimal & cannot touch player funds**: owner only `fundHouse` / `withdrawHouse` (the house pool) + `pause`. Player `chips` are tracked separately (`totalChips`); **cash-out works even while paused**.
- Invariant: `cusd.balanceOf(contract) == totalChips + houseLiquidity`.

### 4.2 Constants
`MIN_BET = 0.01 cUSD` · `MAX_BET = 5 cUSD` · payout `1.95×` (`PAYOUT_NUM/DEN = 195/100`) → ~2.5% house edge.

### 4.3 Interface
```solidity
// Player
function buyCredits(uint256 amount) external;          // approve cUSD first; chips += amount
function cashOut(uint256 amount) external;             // chips -> cUSD; ALWAYS allowed (ignores pause)
function flip(uint256 bet, bool choiceHeads)           // 1 tx, O(1), no external calls
    external returns (bool won, bool resultHeads);

// Owner (Ownable2Step) — house only, never player chips
function fundHouse(uint256 amount) external;
function withdrawHouse(uint256 amount) external;
function pause() / unpause() external;

// Views
function chips(address) view returns (uint256);
function houseLiquidity() view returns (uint256);
function previewNetWin(uint256 bet) view returns (uint256);
function backingRequired() view returns (uint256);     // totalChips + houseLiquidity
```

### 4.4 Randomness (caveat)
`flip()` derives the result from `keccak256(prevrandao, blockhash(n-1), msg.sender, nonce, bet)`. Good enough for a **low-stakes** game; a block proposer could bias it, so bets are capped by `MAX_BET`. v2 may move to commit-reveal/VRF.

### 4.5 Events
`Flipped(player, bet, choiceHeads, resultHeads, won, payout, newChips)`, `CreditsBought(player, amount, newChips)`, `CashedOut(player, amount, newChips)`, `HouseFunded`, `HouseWithdrawn`.

### 4.6 Tests
17 Foundry tests passing: buy/cash, flip settlement, all reverts, paused-cash-out, **backing invariant over many flips**, **owner can't touch player chips**, fuzz.

---

## 5. Frontend (`frontend/`)
Next.js App Router, two surfaces, mobile-first.

- **Landing (`/`)** — marketing page (orange/Claude theme). ⚠️ copy still being migrated from the old auto-save template to the game.
- **Game (`/app`)** — the product:
  1. Connect (auto-connect in MiniPay) / wrong-network switch
  2. Coin UI — **Heads = orange**, **Tails = gray**, animated flip
  3. Pick side + bet (cUSD quick-picks) → **Flip** (1 tx) → win/lose from `Flipped` event
  4. Buy chips (approve + `buyCredits`), **Cash out** anytime
  5. Recent flips (from events), chips/house/wallet balances
- Stack: wagmi v2 + viem + Tailwind. Chains: Celo + Celo Sepolia. Contract address/ABI in `lib/contracts.ts` (vault via `NEXT_PUBLIC_FLIP_*`).

---

## 6. Deploy plan (Mainnet-direct)
1. Get CELO (gas) + cUSD (house funding + play) in the deployer wallet.
2. `contracts/.env`: `PRIVATE_KEY`, optional `OWNER`, optional `HOUSE_AMOUNT`.
3. Deploy `XikomuFlip` pointing at **real cUSD** (`script/DeployFlip.s.sol`) + fund the house pool.
4. Verify on Celoscan.
5. Set frontend env: `NEXT_PUBLIC_FLIP_CELO=<addr>`, `NEXT_PUBLIC_START_BLOCK=<block>`; deploy to Vercel.
6. Register on talent.app + enroll campaign.

> The house pool must hold enough cUSD to pay the max single-win (`bet*0.95`). Start small; top up via `fundHouse`.

---

## 7. Metric strategy (legit, Proof of Ship)
- **Tx volume**: 1 flip = 1 tx; fast replay → high organic tx from real players.
- **DAU**: short, fun loop → players return; promote via build-in-public.
- **Commits/PRs**: small focused PRs (contract, FE screens, polish, docs).
- **Booster**: MiniPay hook + verified mainnet contract + open source.
- ❌ No bots/farming — real play only.

---

## 8. Milestones
| Step | Deliverable |
|---|---|
| ✅ | `XikomuFlip` + 17 tests; testnet deploy script; mainnet deploy script |
| ✅ | `/app` game UI (flip, buy, cash out, history) |
| ▶ | Mainnet deploy + verify + fund house |
| ▶ | Wire frontend env + deploy Vercel |
| ▶ | Migrate landing copy to the game |
| ▶ | Register talent.app + go-to-market (real players) |

## 9. Definition of done (v1)
- [ ] `XikomuFlip` verified on Celoscan (mainnet), house funded
- [ ] `forge test` green
- [ ] FE live on Vercel, playable in MiniPay & web (real flips on mainnet)
- [ ] Public repo + README + PRD
- [ ] Registered on talent.app + Proof of Ship campaign
