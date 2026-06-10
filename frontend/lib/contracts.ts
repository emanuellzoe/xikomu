import type { Address } from "viem";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/** XikomuFlip game per chain. Filled after deploy (via env). */
export const FLIP: Record<number, Address> = {
  [celo.id]: (process.env.NEXT_PUBLIC_FLIP_CELO as Address) || ZERO_ADDRESS,
  [celoAlfajores.id]: (process.env.NEXT_PUBLIC_FLIP_ALFAJORES as Address) || ZERO_ADDRESS,
  [celoSepolia.id]: (process.env.NEXT_PUBLIC_FLIP_SEPOLIA as Address) || ZERO_ADDRESS,
};

export const EXPLORER: Record<number, string> = {
  [celo.id]: "https://celoscan.io",
  [celoAlfajores.id]: "https://alfajores.celoscan.io",
  [celoSepolia.id]: "https://sepolia.celoscan.io",
};

export const CHAIN_LABEL: Record<number, string> = {
  [celo.id]: "Celo",
  [celoAlfajores.id]: "Alfajores",
  [celoSepolia.id]: "Celo Sepolia",
};

export const SUPPORTED_CHAIN_IDS: number[] = [celo.id, celoAlfajores.id, celoSepolia.id];

/** First block to scan for history events (set after deploy for efficiency). */
export const START_BLOCK: bigint = BigInt(process.env.NEXT_PUBLIC_START_BLOCK ?? "0");

export const CUSD_DECIMALS = 18;

export function isFlipConfigured(chainId: number): boolean {
  // Native CELO game — only the game address is needed (no token).
  const f = FLIP[chainId];
  return !!f && f.toLowerCase() !== ZERO_ADDRESS;
}

export const MIN_BET = 10_000_000_000_000_000n; // 0.01 CELO
export const MAX_BET = 5_000_000_000_000_000_000n; // 5 CELO

// Payout math, mirrors XikomuFlip: a win returns 1.95x, so net winnings the
// house must pay is bet * (195 - 100) / 100 = bet * 0.95.
export const PAYOUT_NUM = 195n;
export const PAYOUT_DEN = 100n;

/** Net CELO the house pays out on a winning `bet` (bet * 0.95). */
export function netWin(bet: bigint): bigint {
  return (bet * PAYOUT_NUM) / PAYOUT_DEN - bet;
}

/** Largest bet whose win the house pool can currently cover. */
export function maxBetForHouse(house: bigint): bigint {
  // bet * 0.95 <= house  =>  bet <= house * 100 / 95
  const max = (house * PAYOUT_DEN) / (PAYOUT_NUM - PAYOUT_DEN);
  return max > MAX_BET ? MAX_BET : max;
}

export const flipAbi = [
  { type: "function", name: "buyCredits", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "cashOut", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "flip", stateMutability: "nonpayable", inputs: [{ name: "bet", type: "uint256" }, { name: "choiceHeads", type: "bool" }], outputs: [{ name: "won", type: "bool" }, { name: "resultHeads", type: "bool" }] },
  { type: "function", name: "chips", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "houseLiquidity", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "previewNetWin", stateMutability: "view", inputs: [{ name: "bet", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bool" }] },
  { type: "event", name: "Flipped", inputs: [
    { name: "player", type: "address", indexed: true },
    { name: "bet", type: "uint256", indexed: false },
    { name: "choiceHeads", type: "bool", indexed: false },
    { name: "resultHeads", type: "bool", indexed: false },
    { name: "won", type: "bool", indexed: false },
    { name: "payout", type: "uint256", indexed: false },
    { name: "newChips", type: "uint256", indexed: false },
  ] },
  { type: "event", name: "CreditsBought", inputs: [{ name: "player", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }, { name: "newChips", type: "uint256", indexed: false }] },
  { type: "event", name: "CashedOut", inputs: [{ name: "player", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }, { name: "newChips", type: "uint256", indexed: false }] },
] as const;
