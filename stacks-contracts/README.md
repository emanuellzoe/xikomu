# Xikomu Lucky Flip — Stacks (Clarity)

A native-**STX** coin-flip game on **Stacks**. Same idea as the Celo build
([`contracts/src/XikomuFlip.sol`](../contracts/src/XikomuFlip.sol)) — ported to
**Clarity** for a Stacks hackathon.

- Buy **chips** with native STX (1 chip = 1 microSTX), **no token approval**.
- `flip(bet, choice-heads)` — 1 on-chain tx, O(1), win **1.95×** or lose the bet to the house.
- **Cash out** chips to STX anytime — *always* allowed, even while paused.

It is a **game, not custodial DeFi**: chips are game credits, and the owner can
only ever touch the **house pool** — never a player's chips. The contract
custodies STX equal to `total-chips + house-liquidity`.

## Contract

[`contracts/xikomu-flip.clar`](./contracts/xikomu-flip.clar) (Clarity 2, epoch 2.1).

| Solidity (`XikomuFlip.sol`) | Clarity (`xikomu-flip.clar`) |
|---|---|
| `buyCredits()` payable | `buy-credits (amount uint)` — pulls STX via `stx-transfer?` |
| `cashOut(amount)` | `cash-out (amount uint)` — `as-contract` payout, ignores pause |
| `flip(bet, choiceHeads)` | `flip (bet uint) (choice-heads bool)` → `(ok { won, result-heads })` |
| `fundHouse()` / `withdrawHouse()` | `fund-house` / `withdraw-house` (owner only) |
| `pause()` / `unpause()` | `pause` / `unpause` (owner only) |
| `Ownable2Step` | `transfer-ownership` + `accept-ownership` |
| `keccak256(prevrandao, blockhash, …)` | `keccak256(vrf-seed ‖ sender ‖ nonce ‖ bet ‖ height)` |

**Constants:** `MIN-BET = 0.01 STX` (`u10000`), `MAX-BET = 5 STX` (`u5000000`),
payout `195/100` → ~2.5% house edge.

**Error codes:** `u100` not-owner · `u101` zero-amount · `u102` bet-out-of-range
· `u103` insufficient-chips · `u104` insufficient-house · `u105` paused ·
`u106`/`u107` ownership.

> **Randomness caveat:** the coin comes from the previous block's VRF seed mixed
> with sender/nonce/bet/height. Fine for a low-stakes game; a miner could bias
> it, so bets are capped by `MAX-BET`. v2 may move to commit-reveal.

## Test

17 tests via the Clarinet SDK simnet (mirrors the 17 Foundry tests):
buy/cash, flip settlement, every revert, paused-cash-out, the **backing
invariant over many flips**, **owner can't touch player chips**, and 2-step
ownership.

```bash
cd stacks-contracts
npm install
npm test            # 17 passing
```

> Uses `@stacks/clarinet-sdk` (wasm) — no separate `clarinet` binary needed to
> run the tests. To use the CLI (`clarinet check`, `clarinet console`,
> `clarinet deployments`), install Clarinet:
> `brew install clarinet` (or see hirosystems/clarinet).

## Deployed (Stacks Testnet)

| What | Value |
|---|---|
| **Contract** | `ST20RVFS6R3ZXJ01NZVV3FHKTQXRG4NY3WMQYWZK2.xikomu-flip` |
| Explorer | https://explorer.hiro.so/txid/ST20RVFS6R3ZXJ01NZVV3FHKTQXRG4NY3WMQYWZK2.xikomu-flip?chain=testnet |
| Owner / deployer | `ST20RVFS6R3ZXJ01NZVV3FHKTQXRG4NY3WMQYWZK2` |
| House pool | funded with 100 STX |

## Deploy it yourself (testnet)

```bash
# 1. Put a funded testnet deployer mnemonic in settings/Testnet.toml (gitignored).
#    Get the address's STX from the Hiro faucet: https://platform.hiro.so/faucet
clarinet deployments generate --testnet --low-cost
clarinet deployments apply -p deployments/default.testnet-plan.yaml \
  --no-dashboard --use-on-disk-deployment-plan
```

Then, as the owner, seed the house pool so it can cover winning payouts (it must
hold at least one max single win = `bet * 0.95`). Helper script:

```bash
node scripts/call.mjs fund-house 100000000   # fund 100 STX
node scripts/call.mjs buy-credits 1000000    # buy 1 STX of chips
node scripts/call.mjs flip 100000 true       # bet 0.1 STX on heads
```
```
