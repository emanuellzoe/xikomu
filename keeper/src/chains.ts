import { defineChain, type Chain } from "viem";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";

/// Local Foundry/anvil node for end-to-end testing.
export const anvil = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
});

export type ChainName = "celo" | "alfajores" | "sepolia" | "local";

export function resolveChain(name: ChainName): Chain {
  switch (name) {
    case "celo":
      return celo;
    case "alfajores":
      return celoAlfajores;
    case "sepolia":
      return celoSepolia;
    case "local":
      return anvil;
    default:
      throw new Error(`Unknown CHAIN "${name}" (use celo | alfajores | sepolia | local)`);
  }
}
