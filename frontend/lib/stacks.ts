// Stacks (Clarity) Lucky Flip config + on-chain helpers.
//
// Talks to the `xikomu-flip` Clarity contract (see ../../stacks-contracts).
// Reads use the Hiro read-only API; writes go through the connected wallet
// (Xverse / Leather) via @stacks/connect's `request('stx_callContract', …)`.

import {
  Cl,
  cvToValue,
  fetchCallReadOnlyFunction,
  type ClarityValue,
} from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";

export const NETWORK = STACKS_TESTNET;
export const NETWORK_NAME = "testnet" as const;

// Deployed testnet contract (overridable via env for mainnet later).
export const FLIP_ADDRESS =
  process.env.NEXT_PUBLIC_STX_FLIP_ADDRESS ?? "ST20RVFS6R3ZXJ01NZVV3FHKTQXRG4NY3WMQYWZK2";
export const FLIP_NAME = process.env.NEXT_PUBLIC_STX_FLIP_NAME ?? "xikomu-flip";
export const FLIP_ID = `${FLIP_ADDRESS}.${FLIP_NAME}` as const;

export const EXPLORER = "https://explorer.hiro.so";
export const HIRO_API = "https://api.testnet.hiro.so";

// Mirrors the contract constants (microSTX). 1 STX = 1_000_000 µSTX.
export const STX_DECIMALS = 6;
export const ONE_STX = 1_000_000n;
export const MIN_BET = 10_000n; // 0.01 STX
export const MAX_BET = 5_000_000n; // 5 STX
export const PAYOUT_NUM = 195n;
export const PAYOUT_DEN = 100n;

// ---- math (matches xikomu-flip.clar) -------------------------------------

/** Net winnings added to chips if `bet` wins (~0.95 × bet). */
export function netWin(bet: bigint): bigint {
  if (bet <= 0n) return 0n;
  return (bet * PAYOUT_NUM) / PAYOUT_DEN - bet;
}

/** Largest bet the house can currently cover, capped at MAX_BET. */
export function maxBetForHouse(house: bigint): bigint {
  // netWin(bet) = bet*95/100 ≤ house  →  bet ≤ house*100/95
  const coverable = (house * 100n) / 95n;
  return coverable < MAX_BET ? coverable : MAX_BET;
}

// ---- formatting ----------------------------------------------------------

export function toMicro(stx: string): bigint {
  const [whole, frac = ""] = stx.trim().split(".");
  const fracPadded = (frac + "0".repeat(STX_DECIMALS)).slice(0, STX_DECIMALS);
  return BigInt(whole || "0") * ONE_STX + BigInt(fracPadded || "0");
}

export function fmtStx(micro?: bigint, max = 2): string {
  if (micro === undefined) return "0";
  return (Number(micro) / Number(ONE_STX)).toLocaleString(undefined, {
    maximumFractionDigits: max,
  });
}

export function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 5)}…${a.slice(-4)}` : "";
}

// ---- read-only views -----------------------------------------------------

async function readUint(functionName: string, functionArgs: ClarityValue[] = []): Promise<bigint> {
  const cv = await fetchCallReadOnlyFunction({
    contractAddress: FLIP_ADDRESS,
    contractName: FLIP_NAME,
    functionName,
    functionArgs,
    senderAddress: FLIP_ADDRESS,
    network: NETWORK,
  });
  return BigInt(cvToValue(cv));
}

export const getChips = (addr: string) => readUint("get-chips", [Cl.principal(addr)]);
export const getHouse = () => readUint("get-house-liquidity");
export const getTotalChips = () => readUint("get-total-chips");

// ---- wallet writes (Cl-encoded args) -------------------------------------
// These are thin descriptors; the page calls request('stx_callContract', …)
// so wallet popups stay in the click handler (popup-blocker friendly).

export const buyCreditsArgs = (micro: bigint) => [Cl.uint(micro)];
export const flipArgs = (bet: bigint, heads: boolean) => [Cl.uint(bet), Cl.bool(heads)];
export const cashOutArgs = (micro: bigint) => [Cl.uint(micro)];

// ---- transactions (confirmation polling via Hiro API) --------------------

export interface HiroTx {
  tx_status?: string;
  tx_result?: { repr?: string };
  tx_id?: string;
}

export async function fetchTx(txid: string): Promise<HiroTx | null> {
  const id = txid.startsWith("0x") ? txid : `0x${txid}`;
  const r = await fetch(`${HIRO_API}/extended/v1/tx/${id}`);
  if (!r.ok) return null;
  return (await r.json()) as HiroTx;
}

/** Resolve once the tx is confirmed; throw on abort/timeout. */
export async function waitForTx(
  txid: string,
  { tries = 40, intervalMs = 3000 }: { tries?: number; intervalMs?: number } = {},
): Promise<HiroTx> {
  for (let i = 0; i < tries; i++) {
    const tx = await fetchTx(txid);
    const s = tx?.tx_status;
    if (s === "success") return tx as HiroTx;
    if (s && s.startsWith("abort")) throw new Error(tx?.tx_result?.repr ?? "transaction failed");
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  throw new Error("confirmation timed out");
}

/** Parse a flip tx result repr, e.g. "(ok (tuple (result-heads false) (won true)))". */
export function parseFlipResult(repr?: string): { won: boolean; resultHeads: boolean } | null {
  if (!repr || !/won/.test(repr)) return null;
  return {
    won: /\(won (true|false)\)/.exec(repr)?.[1] === "true",
    resultHeads: /\(result-heads (true|false)\)/.exec(repr)?.[1] === "true",
  };
}
