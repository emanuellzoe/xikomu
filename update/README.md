# Xikomu — Activity & Growth (`update/`)

**On-chain-verifiable** analytics for Xikomu Lucky Flip — plus a growth plan.
Everything here reads **real events** from the deployed `XikomuFlip` contract on
Celo Mainnet, and every row links to its Celoscan tx so anyone can verify it.

## Contents

| File | What |
|---|---|
| `activity-report.mjs` | Reads real `Flipped` / `CreditsBought` / `CashedOut` events and writes the log + stats |
| `activity.log` | The 10 most recent **real** flips, each with its tx hash |
| `stats.json` | Aggregate metrics (real): total flips, unique players, volume, win rate, house pool |
| `stats.js` | Same data as `window.XIKOMU_STATS`, so `dashboard.html` works offline (`file://`) |
| `dashboard.html` | A static dashboard that renders `stats.js` (orange theme) |
| `GROWTH.md` | A growth plan built on real, on-chain usage |

## Generate / refresh the data

```bash
cd update
npm install
npm run report      # reads Celo Mainnet and rewrites activity.log + stats.json + stats.js
```

Config via env (all optional — defaults point at the live mainnet game):

```bash
RPC_URL=https://forno.celo.org \
FLIP_ADDRESS=0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd \
START_BLOCK=68997210 \
RECENT_LIMIT=10 \
npm run report
```

## View the dashboard

Open `dashboard.html` in a browser (works straight from disk), or serve the
folder: `npx serve update`.

## Why on-chain only

These numbers are meant to be checked: pick any row in `activity.log`, open it
on [Celoscan](https://celoscan.io), and confirm it's a real transaction.
