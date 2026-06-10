const txid = process.argv[2].replace(/^0x/, "");
for (let i = 0; i < 30; i++) {
  const r = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/0x${txid}`).then((x) => x.json());
  if (r.tx_status === "success") { console.log("ok", r.tx_result?.repr ?? ""); process.exit(0); }
  if (r.tx_status && r.tx_status.startsWith("abort")) { console.log("FAIL", r.tx_status, r.tx_result?.repr); process.exit(1); }
  await new Promise((s) => setTimeout(s, 10000));
}
console.log("pending"); process.exit(0);
