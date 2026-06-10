// Broadcast a contract-call to the deployed testnet contract.
// Usage: node scripts/call.mjs <function-name> [uintArg] [boolArg]
import { generateWallet } from "@stacks/wallet-sdk";
import {
  makeContractCall, broadcastTransaction, Cl,
  getAddressFromPrivateKey, PostConditionMode,
} from "@stacks/transactions";
import { readFileSync } from "node:fs";

const MNEMONIC = readFileSync("settings/Testnet.toml", "utf8")
  .match(/mnemonic\s*=\s*"([^"]+)"/)[1];
const wallet = await generateWallet({ secretKey: MNEMONIC, password: "" });
const senderKey = wallet.accounts[0].stxPrivateKey;
const sender = getAddressFromPrivateKey(senderKey, "testnet");

const CONTRACT_ADDRESS = sender; // deployer == owner
const CONTRACT_NAME = "xikomu-flip";

const [fn, ...rest] = process.argv.slice(2);
const args = rest.map((a) =>
  a === "true" ? Cl.bool(true) : a === "false" ? Cl.bool(false) : Cl.uint(BigInt(a))
);

const tx = await makeContractCall({
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  functionName: fn,
  functionArgs: args,
  senderKey,
  network: "testnet",
  postConditionMode: PostConditionMode.Allow,
});
const res = await broadcastTransaction({ transaction: tx, network: "testnet" });
console.log(JSON.stringify({ fn, args: rest, sender, ...res }, null, 2));
