// Xikomu — honest on-chain activity report.
//
// Reads REAL events from the deployed XikomuFlip game on Celo Mainnet and
// writes:
//   - activity.log  : the RECENT_LIMIT most recent real flips (with tx hash)
//   - stats.json    : aggregate metrics derived purely from on-chain events
//   - stats.js      : same data as window.XIKOMU_STATS (so dashboard.html
//                     works offline from file://)
//
// No wallets are created, funded, or transacted. This only *reads* the chain.
// Every number can be verified on Celoscan.

import { createPublicClient, http, formatUnits, parseAbiItem, getAddress } from "viem";
import { celo } from "viem/chains";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

const RPC_URL = process.env.RPC_URL || "https://forno.celo.org";
const FLIP_ADDRESS = getAddress(process.env.FLIP_ADDRESS || "0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd");
const START_BLOCK = BigInt(process.env.START_BLOCK || "68997210");
const RECENT_LIMIT = Number(process.env.RECENT_LIMIT || "10");
const CHUNK = BigInt(process.env.CHUNK || "10000");
const EXPLORER = "https://celoscan.io";

const FLIPPED = parseAbiItem(
  "event Flipped(address indexed player, uint256 bet, bool choiceHeads, bool resultHeads, bool won, uint256 payout, uint256 newChips)",
);
const CREDITS_BOUGHT = parseAbiItem(
  "event CreditsBought(address indexed player, uint256 amount, uint256 newChips)",
);
const CASHED_OUT = parseAbiItem(
  "event CashedOut(address indexed player, uint256 amount, uint256 newChips)",
);
const HOUSE_ABI = [
  { type: "function", name: "houseLiquidity", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
];

const client = createPublicClient({ chain: celo, transport: http(RPC_URL) });
const CELO = (v) => Number(formatUnits(v, 18));
const fmt = (v, max = 4) => CELO(v).toLocaleString("en-US", { maximumFractionDigits: max });
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

async function getAllLogs(event) {
  const latest = await client.getBlockNumber();
  const out = [];
  for (let from = START_BLOCK; from <= latest; from += CHUNK + 1n) {
    const to = from + CHUNK > latest ? latest : from + CHUNK;
    const logs = await client.getLogs({ address: FLIP_ADDRESS, event, fromBlock: from, toBlock: to });
    out.push(...logs);
    process.stderr.write(`\r  ${event.name}: scanned to block ${to} (${out.length} events)   `);
  }
  process.stderr.write("\n");
  return out;
}

async function main() {
  console.error(`Reading XikomuFlip ${FLIP_ADDRESS} on Celo Mainnet via ${RPC_URL} …`);

  const [flips, bought, cashed] = [
    await getAllLogs(FLIPPED),
    await getAllLogs(CREDITS_BOUGHT),
    await getAllLogs(CASHED_OUT),
  ];

  let house = 0n;
  try {
    house = await client.readContract({ address: FLIP_ADDRESS, abi: HOUSE_ABI, functionName: "houseLiquidity" });
  } catch { /* house read is best-effort */ }

  // Aggregates — all from real events.
  const players = new Set();
  let totalWagered = 0n;
  let wins = 0;
  for (const l of flips) {
    players.add(l.args.player.toLowerCase());
    totalWagered += l.args.bet;
    if (l.args.won) wins += 1;
  }
  const totalBought = bought.reduce((s, l) => s + l.args.amount, 0n);
  const totalCashed = cashed.reduce((s, l) => s + l.args.amount, 0n);

  // Most recent real flips (newest first), with timestamps for the few we show.
  const recentLogs = [...flips].sort((a, b) =>
    a.blockNumber === b.blockNumber ? b.logIndex - a.logIndex : Number(b.blockNumber - a.blockNumber),
  ).slice(0, RECENT_LIMIT);

  const recent = [];
  for (const l of recentLogs) {
    let ts = null;
    try { ts = Number((await client.getBlock({ blockNumber: l.blockNumber })).timestamp); } catch { /* skip */ }
    recent.push({
      tx: l.transactionHash,
      block: Number(l.blockNumber),
      time: ts ? new Date(ts * 1000).toISOString() : null,
      player: l.args.player,
      choice: l.args.choiceHeads ? "Heads" : "Tails",
      result: l.args.resultHeads ? "Heads" : "Tails",
      won: l.args.won,
      betCELO: fmt(l.args.bet),
      payoutCELO: fmt(l.args.payout),
      explorer: `${EXPLORER}/tx/${l.transactionHash}`,
    });
  }

  const generatedAtBlock = Number(await client.getBlockNumber());
  const stats = {
    contract: FLIP_ADDRESS,
    chain: "Celo Mainnet",
    chainId: celo.id,
    explorer: `${EXPLORER}/address/${FLIP_ADDRESS}`,
    generatedAtBlock,
    note: "All figures are read from real on-chain events. No bots, no generated wallets, no farming.",
    totals: {
      flips: flips.length,
      uniquePlayers: players.size,
      wins,
      losses: flips.length - wins,
      winRatePct: flips.length ? Math.round((wins / flips.length) * 1000) / 10 : 0,
      totalWageredCELO: fmt(totalWagered),
      creditsBoughtCELO: fmt(totalBought),
      cashedOutCELO: fmt(totalCashed),
      housePoolCELO: fmt(house),
    },
    recent,
  };

  // activity.log — human-readable, one real flip per line, newest first.
  const lines = recent.length
    ? recent.map((r) => {
        const when = r.time ? r.time.replace("T", " ").replace(".000Z", "Z") : `block ${r.block}`;
        const res = r.won ? `WON +${r.payoutCELO}` : "lost";
        return `${when} | ${short(r.player)} | ${r.choice}→${r.result} ${res} | bet ${r.betCELO} CELO | ${r.explorer}`;
      })
    : ["No on-chain flips found yet for this contract."];
  const header = `# Xikomu real on-chain activity — ${recent.length} most recent flips (of ${flips.length} total)\n`
    + `# Contract ${FLIP_ADDRESS} · generated at block ${generatedAtBlock}\n`
    + `# Verify any line on Celoscan.\n`;

  writeFileSync(join(HERE, "activity.log"), header + lines.join("\n") + "\n");
  writeFileSync(join(HERE, "stats.json"), JSON.stringify(stats, null, 2) + "\n");
  writeFileSync(join(HERE, "stats.js"), `window.XIKOMU_STATS = ${JSON.stringify(stats, null, 2)};\n`);

  // Keep the landing page's real numbers in sync with the latest snapshot.
  try {
    const fe = {
      flips: stats.totals.flips,
      uniquePlayers: stats.totals.uniquePlayers,
      winRatePct: stats.totals.winRatePct,
      totalWageredCELO: stats.totals.totalWageredCELO,
      block: generatedAtBlock,
      contract: FLIP_ADDRESS,
      explorer: stats.explorer,
    };
    const ts = `// Real on-chain snapshot of XikomuFlip on Celo Mainnet.\n`
      + `// Auto-generated by update/activity-report.mjs — refresh with \`cd update && npm run report\`.\n`
      + `// Every number is verifiable on Celoscan.\n`
      + `export const ONCHAIN_STATS = ${JSON.stringify(fe, null, 2)};\n`;
    writeFileSync(join(HERE, "..", "frontend", "lib", "onchainStats.ts"), ts);
  } catch { /* frontend/lib not present — skip */ }

  console.error(
    `\nDone. ${flips.length} flips · ${players.size} players · ${fmt(totalWagered)} CELO wagered · house ${fmt(house)} CELO.`,
  );
  console.error(`Wrote activity.log, stats.json, stats.js (recent shown: ${recent.length}).`);
}

main().catch((e) => {
  console.error("Report failed:", e?.shortMessage || e?.message || e);
  process.exit(1);
});
