import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  type Address,
  type Log,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "./config.js";
import { vaultAbi } from "./abi.js";

/**
 * Xikomu keeper bot.
 *
 * Deterministic, schedule-based — NOT an AI/price oracle. Each cycle it:
 *   1) syncs the set of active plan owners from PlanCreated/PlanCancelled events (OFF-chain),
 *   2) for each user, checks previewDue() (a free view), and
 *   3) sends executeSave(user) for those that are due — one tx per user (O(1) on-chain).
 *
 * The keeper holds NO user funds. executeSave only moves a user's pre-approved cUSD
 * into that user's own vault balance, withdrawable only by them.
 */

const transport = http(config.rpcUrl);
const publicClient = createPublicClient({ chain: config.chain, transport });
const account = privateKeyToAccount(config.keeperPrivateKey);
const walletClient = createWalletClient({ account, chain: config.chain, transport });

const vault = { address: config.vaultAddress, abi: vaultAbi } as const;

// In-memory state. For a hackathon this is fine; restart re-scans from START_BLOCK.
const activeUsers = new Set<Address>();
let cursor = config.startBlock;

const PLAN_CREATED = vaultAbi.find((x) => x.type === "event" && x.name === "PlanCreated")!;
const PLAN_CANCELLED = vaultAbi.find((x) => x.type === "event" && x.name === "PlanCancelled")!;

function ts(): string {
  return new Date().toISOString();
}

/** Pull new PlanCreated/PlanCancelled logs and update the active-user set, in event order. */
async function sync(): Promise<void> {
  const latest = await publicClient.getBlockNumber();
  if (cursor > latest) return;

  const [created, cancelled] = await Promise.all([
    publicClient.getLogs({ address: vault.address, event: PLAN_CREATED as any, fromBlock: cursor, toBlock: latest }),
    publicClient.getLogs({ address: vault.address, event: PLAN_CANCELLED as any, fromBlock: cursor, toBlock: latest }),
  ]);

  // Apply in chronological order so create→cancel→create sequences resolve correctly.
  const events = [
    ...created.map((l) => ({ log: l, kind: "created" as const })),
    ...cancelled.map((l) => ({ log: l, kind: "cancelled" as const })),
  ].sort((a, b) => {
    const bn = Number((a.log.blockNumber ?? 0n) - (b.log.blockNumber ?? 0n));
    return bn !== 0 ? bn : (a.log.logIndex ?? 0) - (b.log.logIndex ?? 0);
  });

  for (const { log, kind } of events) {
    const user = (log as Log & { args: { user: Address } }).args.user;
    if (!user) continue;
    const addr = getAddress(user);
    if (kind === "created") activeUsers.add(addr);
    else activeUsers.delete(addr);
  }

  cursor = latest + 1n;
  if (events.length) console.log(`[${ts()}] sync: +${created.length} -${cancelled.length} | tracking ${activeUsers.size} users`);
}

/** Execute due saves, bounded by BATCH_SIZE. */
async function executeDue(): Promise<void> {
  let sent = 0;
  for (const user of activeUsers) {
    if (sent >= config.batchSize) break;

    let due: boolean;
    try {
      due = (await publicClient.readContract({ ...vault, functionName: "previewDue", args: [user] })) as boolean;
    } catch (e) {
      console.warn(`[${ts()}] previewDue failed for ${user}:`, (e as Error).message);
      continue;
    }
    if (!due) continue;

    try {
      const hash = await walletClient.writeContract({ ...vault, functionName: "executeSave", args: [user] });
      await publicClient.waitForTransactionReceipt({ hash });
      sent++;
      console.log(`[${ts()}] ✓ executeSave(${user}) → ${hash}`);
    } catch (e) {
      // e.g. allowance revoked, or raced with another keeper (NotDue). Safe to skip.
      console.warn(`[${ts()}] skip ${user}:`, (e as { shortMessage?: string }).shortMessage ?? (e as Error).message);
    }
  }
  if (sent) console.log(`[${ts()}] cycle done: ${sent} save(s) executed`);
}

async function cycle(): Promise<void> {
  await sync();
  await executeDue();
}

async function main(): Promise<void> {
  const once = process.argv.includes("--once");
  console.log(`[${ts()}] keeper start | chain=${config.chainName} vault=${config.vaultAddress} signer=${account.address}`);

  if (await publicClient.readContract({ ...vault, functionName: "paused" })) {
    console.warn(`[${ts()}] WARNING: vault is paused — executeSave will revert until unpaused.`);
  }

  if (once) {
    await cycle();
    console.log(`[${ts()}] --once complete`);
    return;
  }

  // Self-scheduling loop (avoids overlap if a cycle runs long).
  for (;;) {
    try {
      await cycle();
    } catch (e) {
      console.error(`[${ts()}] cycle error:`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, config.intervalSeconds * 1000));
  }
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
