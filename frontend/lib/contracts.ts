import type { Address } from "viem";
import { celo, celoAlfajores } from "wagmi/chains";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/** cUSD token per chain. */
export const CUSD: Record<number, Address> = {
  [celo.id]: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  [celoAlfajores.id]: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
};

/** AutoSaveVault per chain. Filled after deploy (via env). */
export const VAULT: Record<number, Address> = {
  [celo.id]: (process.env.NEXT_PUBLIC_VAULT_CELO as Address) || ZERO_ADDRESS,
  [celoAlfajores.id]: (process.env.NEXT_PUBLIC_VAULT_ALFAJORES as Address) || ZERO_ADDRESS,
};

/** First block to scan for history events (set after deploy for efficiency). */
export const START_BLOCK: bigint = BigInt(process.env.NEXT_PUBLIC_START_BLOCK ?? "0");

export const CUSD_DECIMALS = 18;

export function isConfigured(chainId: number): boolean {
  const v = VAULT[chainId];
  return !!v && v.toLowerCase() !== ZERO_ADDRESS;
}

export const SUPPORTED_CHAIN_IDS = [celo.id, celoAlfajores.id];

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
