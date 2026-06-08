import type { Address } from "viem";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * Chip token per chain — what players deposit/cash out of the Flip game.
 * Mainnet runs a FULL CELO build: the token is native CELO via its GoldToken
 * ERC20 (18 decimals), NOT cUSD. The var name is kept as CUSD for compatibility.
 * Celo Sepolia uses a deployed test token (set via env).
 */
export const CUSD: Record<number, Address> = {
  [celo.id]: "0x471EcE3750Da237f93B8E339c536989b8978a438", // CELO (GoldToken)
  [celoAlfajores.id]: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  [celoSepolia.id]: (process.env.NEXT_PUBLIC_CUSD_SEPOLIA as Address) || ZERO_ADDRESS,
};

/** AutoSaveVault per chain (legacy auto-save product). */
export const VAULT: Record<number, Address> = {
  [celo.id]: (process.env.NEXT_PUBLIC_VAULT_CELO as Address) || ZERO_ADDRESS,
  [celoAlfajores.id]: (process.env.NEXT_PUBLIC_VAULT_ALFAJORES as Address) || ZERO_ADDRESS,
  [celoSepolia.id]: (process.env.NEXT_PUBLIC_VAULT_SEPOLIA as Address) || ZERO_ADDRESS,
};

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

export function isConfigured(chainId: number): boolean {
  const v = VAULT[chainId];
  const c = CUSD[chainId];
  return (
    !!v && v.toLowerCase() !== ZERO_ADDRESS &&
    !!c && c.toLowerCase() !== ZERO_ADDRESS
  );
}

export function isFlipConfigured(chainId: number): boolean {
  // Native CELO game — only the game address is needed (no token).
  const f = FLIP[chainId];
  return !!f && f.toLowerCase() !== ZERO_ADDRESS;
}

export const MIN_BET = 10_000_000_000_000_000n; // 0.01 cUSD
export const MAX_BET = 5_000_000_000_000_000_000n; // 5 cUSD

export const vaultAbi = [
  { type: "function", name: "createPlan", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint128" }, { name: "interval", type: "uint64" }], outputs: [] },
  { type: "function", name: "cancelPlan", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  {
    type: "function", name: "getPlan", stateMutability: "view", inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "tuple", components: [{ name: "amount", type: "uint128" }, { name: "interval", type: "uint64" }, { name: "nextRun", type: "uint64" }] }],
  },
  { type: "function", name: "previewDue", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "event", name: "Saved", inputs: [{ name: "user", type: "address", indexed: true }, { name: "amount", type: "uint128", indexed: false }, { name: "nextRun", type: "uint64", indexed: false }, { name: "newBalance", type: "uint256", indexed: false }] },
  { type: "event", name: "Withdrawn", inputs: [{ name: "user", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
] as const;

export const erc20Abi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

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
