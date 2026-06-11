// Read-only view call. Usage: node scripts/read.mjs <fn> [principalOrUint...]
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
const CONTRACT_ADDRESS = "ST20RVFS6R3ZXJ01NZVV3FHKTQXRG4NY3WMQYWZK2";
const CONTRACT_NAME = "xikomu-flip";
const [fn, ...rest] = process.argv.slice(2);
const args = rest.map((a) => (a.startsWith("ST") ? Cl.principal(a) : Cl.uint(BigInt(a))));
const cv = await fetchCallReadOnlyFunction({
  contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
  functionName: fn, functionArgs: args, senderAddress: CONTRACT_ADDRESS, network: "testnet",
});
console.log(fn, "=>", cvToValue(cv));
