// Live on-chain stats for the landing page.
//
// We ship a baseline snapshot (lib/onchainBaseline.json, regenerated offline by
// update/activity-report.mjs) and only scan the NEW blocks since that baseline
// on each request, then cache the result via ISR (revalidate below).
//
// RPC strategy:
//   - Public forno rate-limits sustained eth_getLogs sweeps, so by default we
//     scan sequentially with pacing and cap how far one request reaches.
//   - Set STATS_RPC_URL to a PRIVATE/dedicated RPC and the scan runs in parallel
//     batches with no pacing and no practical chunk cap — it always reaches head.
// Every number stays verifiable on Celoscan.
import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits, getAddress, parseAbiItem } from "viem";
import { celo } from "viem/chains";
import baseline from "@/lib/onchainBaseline.json";

// Regenerate the cached response at most once every 5 minutes (seconds).
export const revalidate = 300;

const PRIVATE_RPC = process.env.STATS_RPC_URL;
const RPC_URL = PRIVATE_RPC || "https://forno.celo.org";
const FLIP_ADDRESS = getAddress(
  process.env.NEXT_PUBLIC_FLIP_CELO || "0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd",
);
// forno caps eth_getLogs at a 5000-block range.
const CHUNK = BigInt(process.env.STATS_CHUNK || "5000");
// With a private RPC we can scan fast and far; on forno we stay conservative.
const MAX_CHUNKS = Number(process.env.STATS_MAX_CHUNKS || (PRIVATE_RPC ? "4000" : "80"));
const CONCURRENCY = Number(process.env.STATS_CONCURRENCY || (PRIVATE_RPC ? "8" : "1"));
const PACE_MS = Number(process.env.STATS_PACE_MS ?? (PRIVATE_RPC ? "0" : "120"));
const EXPLORER = `https://celoscan.io/address/${FLIP_ADDRESS}`;

const FLIPPED = parseAbiItem(
  "event Flipped(address indexed player, uint256 bet, bool choiceHeads, bool resultHeads, bool won, uint256 payout, uint256 newChips)",
);
const CELO = (v: bigint) => Number(formatUnits(v, 18));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readStats() {
  const client = createPublicClient({ chain: celo, transport: http(RPC_URL) });
  const latest = await client.getBlockNumber();

  // Seed aggregates from the baked-in baseline, then fold in new events.
  const players = new Set<string>(baseline.players as string[]);
  let flips = baseline.flips;
  let wins = baseline.wins;
  let totalWagered = BigInt(baseline.wageredWei);

  // Build the list of [from, to] ranges to scan, newest blocks first capped.
  const ranges: [bigint, bigint][] = [];
  for (let from = BigInt(baseline.block) + 1n; from <= latest && ranges.length < MAX_CHUNKS; from += CHUNK) {
    ranges.push([from, from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n]);
  }

  // `block` tracks the last block we actually covered, so the returned figures
  // are always consistent with it (no half-scanned tail).
  let block = BigInt(baseline.block);
  for (let i = 0; i < ranges.length; i += CONCURRENCY) {
    const batch = ranges.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(([from, to]) => client.getLogs({ address: FLIP_ADDRESS, event: FLIPPED, fromBlock: from, toBlock: to })),
    );
    for (const logs of results) {
      for (const l of logs) {
        flips += 1;
        players.add(l.args.player!.toLowerCase());
        totalWagered += l.args.bet!;
        if (l.args.won) wins += 1;
      }
    }
    block = batch[batch.length - 1][1];
    if (PACE_MS && i + CONCURRENCY < ranges.length) await sleep(PACE_MS);
  }

  return {
    flips,
    uniquePlayers: players.size,
    winRatePct: flips ? Math.round((wins / flips) * 1000) / 10 : 0,
    totalWageredCELO: CELO(totalWagered).toLocaleString("en-US", { maximumFractionDigits: 4 }),
    block: Number(block),
    contract: FLIP_ADDRESS,
    explorer: EXPLORER,
  };
}

export async function GET() {
  try {
    const stats = await readStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    // RPC hiccup or rate limit — fall back to the verifiable baseline snapshot.
    return NextResponse.json(
      {
        flips: baseline.flips,
        uniquePlayers: (baseline.players as string[]).length,
        winRatePct: baseline.flips ? Math.round((baseline.wins / baseline.flips) * 1000) / 10 : 0,
        totalWageredCELO: CELO(BigInt(baseline.wageredWei)).toLocaleString("en-US", { maximumFractionDigits: 4 }),
        block: baseline.block,
        contract: FLIP_ADDRESS,
        explorer: EXPLORER,
        stale: true,
      },
      { headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }
}
