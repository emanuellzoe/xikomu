# Xikomu — Growth plan

Goal: grow **real** players and **real** on-chain activity for Xikomu Lucky
Flip. Every tactic below produces genuine usage that's durable beyond Proof of
Ship.

## Distribution
- **MiniPay first.** It auto-connects, so the friction from "open" to "first
  flip" is near-zero. Submit to the MiniPay dapp directory and test the
  one-tap flow end-to-end on a real phone.
- **Share-to-play.** After a flip result, offer a "share" link (result +
  invite). Keep it native CELO so newcomers don't hit an approval step.
- **Stacks audience.** The same game runs on Stacks testnet — cross-post in
  Stacks/Xverse/Leather communities.

## Retention
- **Daily streak / free-chip nudge** (real, on-chain): a small once-a-day bonus
  to bring players back — funded transparently from the house.
- **Recent-flips & leaderboard** built from real `Flipped` events (this folder
  already reads them) — social proof that the game is alive.

## Transparency as a growth lever
- Publish `dashboard.html` (real metrics) and link it from the README. "Every
  number is verifiable on Celoscan" is a trust signal most casino-style dapps
  can't offer.
- Keep the contract verified and open-source.

## What to measure (honestly)
- Unique players (distinct `player` addresses in events)
- Flips/day, volume wagered, win rate, house solvency
- Run `npm run report` to refresh these from chain — see [`README.md`](./README.md).

## Cadence
Refresh the real snapshot as genuine activity accrues (e.g., daily), so the
numbers stay current, reflecting real growth as it happens.
