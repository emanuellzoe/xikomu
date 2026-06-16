// Turn a raw wallet/RPC error into a short, friendly alert the player can act on.
// Covers the common failures: user-rejected, no gas, a still-pending previous tx,
// wrong network, paused game, and gas-estimation issues.

export type TxErrorInfo = { title: string; message: string };

function pick(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  const e = err as { shortMessage?: string; details?: string; message?: string; cause?: unknown };
  return (
    e.shortMessage ||
    e.details ||
    e.message ||
    (e.cause ? pick(e.cause) : "") ||
    String(err)
  );
}

export function describeTxError(err: unknown): TxErrorInfo {
  const raw = pick(err);
  const s = raw.toLowerCase();

  if (/user rejected|user denied|rejected the request|denied transaction|request rejected/.test(s))
    return { title: "Cancelled", message: "You rejected the transaction in your wallet." };

  if (/insufficient funds|exceeds the balance|insufficient balance|not enough/.test(s))
    return { title: "Not enough CELO for gas", message: "Top up a little CELO to cover gas, then try again." };

  if (/nonce|replacement transaction underpriced|already known|transaction already imported|pending/.test(s))
    return { title: "Previous transaction still pending", message: "Wait for your last transaction to finish, then retry." };

  if (/chain mismatch|does not match the target chain|wrong network|unsupported chain/.test(s))
    return { title: "Wrong network", message: "Switch your wallet to Celo and try again." };

  if (/paused|enforcedpause/.test(s))
    return { title: "Game paused", message: "The game is paused right now — but cash-out still works." };

  if (/intrinsic gas too low|gas required exceeds|cannot estimate gas|execution reverted/.test(s))
    return { title: "Transaction would fail", message: "Try a smaller bet, or try again in a moment." };

  if (/timeout|timed out|network error|failed to fetch/.test(s))
    return { title: "Network hiccup", message: "Couldn't reach the network. Check your connection and retry." };

  // Fallback: show the wallet's own short message if it's compact enough.
  const short = pick(err);
  return {
    title: "Transaction failed",
    message: short && short.length <= 120 ? short : "Something went wrong. Please try again.",
  };
}
