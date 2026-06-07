import "dotenv/config";
import { getAddress, type Hex } from "viem";
import { resolveChain, type ChainName } from "./chains.js";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function asPrivateKey(v: string): Hex {
  const k = v.startsWith("0x") ? v : `0x${v}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(k)) throw new Error("KEEPER_PRIVATE_KEY must be 32-byte hex");
  return k as Hex;
}

const chainName = (process.env.CHAIN ?? "alfajores") as ChainName;
const chain = resolveChain(chainName);

export const config = {
  chainName,
  chain,
  // Allow overriding the RPC; otherwise use the chain's default.
  rpcUrl: process.env.RPC_URL || chain.rpcUrls.default.http[0],
  keeperPrivateKey: asPrivateKey(required("KEEPER_PRIVATE_KEY")),
  vaultAddress: getAddress(required("VAULT_ADDRESS")),
  // Block to start scanning PlanCreated/PlanCancelled from (the deploy block).
  startBlock: BigInt(process.env.START_BLOCK ?? "0"),
  // Seconds between keeper cycles in loop mode.
  intervalSeconds: Number(process.env.INTERVAL_SECONDS ?? "60"),
  // Max executeSave txs per cycle (bounds work; keeper iterates users OFF-chain).
  batchSize: Number(process.env.BATCH_SIZE ?? "25"),
} as const;
