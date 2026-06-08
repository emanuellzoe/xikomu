"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { formatUnits, parseUnits, parseEventLogs, parseAbiItem, type Address } from "viem";
import {
  CHAIN_LABEL,
  CUSD_DECIMALS,
  EXPLORER,
  FLIP,
  MAX_BET,
  MIN_BET,
  START_BLOCK,
  SUPPORTED_CHAIN_IDS,
  ZERO_ADDRESS,
  flipAbi,
  isFlipConfigured,
} from "@/lib/contracts";

// Percent-of-chips quick bets (100 = all chips, capped at MAX_BET).
const BET_PCTS = [10, 25, 50, 100];

const FLIPPED_EVENT = parseAbiItem(
  "event Flipped(address indexed player, uint256 bet, bool choiceHeads, bool resultHeads, bool won, uint256 payout, uint256 newChips)",
);

function fmt(v?: bigint, max = 2): string {
  if (v === undefined) return "0";
  return Number(formatUnits(v, CUSD_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: max });
}
function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

type FlipResult = { won: boolean; resultHeads: boolean; payout: bigint };
type HistoryItem = { resultHeads: boolean; won: boolean; bet: bigint; tx: string };

export default function FlipGamePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const supported = SUPPORTED_CHAIN_IDS.includes(chainId);
  const configured = supported && isFlipConfigured(chainId);
  const flip = (supported ? FLIP[chainId] : ZERO_ADDRESS) as Address;
  const explorer = EXPLORER[chainId] ?? "https://celoscan.io";

  // Auto-connect in MiniPay
  useEffect(() => {
    if (!mounted || isConnected) return;
    if (window.ethereum?.isMiniPay) {
      const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
      if (injected) connect({ connector: injected });
    }
  }, [mounted, isConnected, connect, connectors]);

  // reads
  const { data: gameData, refetch: refetchGame } = useReadContracts({
    contracts:
      configured && address
        ? [
            { address: flip, abi: flipAbi, functionName: "chips", args: [address] },
            { address: flip, abi: flipAbi, functionName: "houseLiquidity" },
          ]
        : [],
    query: { enabled: configured && !!address },
  });
  const chips = gameData?.[0]?.result as bigint | undefined;
  const house = gameData?.[1]?.result as bigint | undefined;

  // Native CELO wallet balance (no token).
  const { data: walletBalData, refetch: refetchWallet } = useBalance({
    address,
    query: { enabled: !!address && supported },
  });
  const walletBal = walletBalData?.value;

  const refetchAll = () => { refetchGame(); refetchWallet(); };

  // writes
  const { writeContract, data: txHash, isPending: writing, error: writeError, reset } = useWriteContract();
  const { data: receipt, isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // form state
  const [choiceHeads, setChoiceHeads] = useState(true);
  const [bet, setBet] = useState("0.1");
  const [buyAmt, setBuyAmt] = useState("1");
  const [result, setResult] = useState<FlipResult | null>(null);
  const [lastAction, setLastAction] = useState<"flip" | "buy" | "cashout" | null>(null);
  const [coinFace, setCoinFace] = useState(true); // displayed face (heads=true)

  const betWei = useMemo(() => {
    try { return bet ? parseUnits(bet, CUSD_DECIMALS) : 0n; } catch { return 0n; }
  }, [bet]);
  const flipping = (writing || confirming) && lastAction === "flip";

  // Set the bet to a percentage of current chips, clamped to [MIN_BET, MAX_BET].
  function setBetPct(pct: number) {
    if (!chips || chips <= 0n) return;
    let w = (chips * BigInt(pct)) / 100n;
    if (w > MAX_BET) w = MAX_BET;
    if (w < MIN_BET) w = MIN_BET;
    setBet(formatUnits(w, CUSD_DECIMALS));
  }
  const betValid = betWei >= MIN_BET && betWei <= MAX_BET && (chips ?? 0n) >= betWei;

  // on tx confirmation, decode result + refresh
  useEffect(() => {
    if (!confirmed || !receipt) return;
    if (lastAction === "flip") {
      try {
        const logs = parseEventLogs({ abi: flipAbi, logs: receipt.logs, eventName: "Flipped" });
        const ev = logs[0]?.args as { won: boolean; resultHeads: boolean; payout: bigint } | undefined;
        if (ev) {
          setResult({ won: ev.won, resultHeads: ev.resultHeads, payout: ev.payout });
          setCoinFace(ev.resultHeads);
        }
      } catch { /* ignore */ }
    }
    refetchAll();
    loadHistory();
    reset();
  }, [confirmed, receipt]); // eslint-disable-line

  function doBuy() {
    let amt: bigint;
    try { amt = parseUnits(buyAmt || "0", CUSD_DECIMALS); } catch { return; }
    if (amt <= 0n) return;
    setLastAction("buy");
    // Native CELO: send value, no token approval.
    writeContract({ address: flip, abi: flipAbi, functionName: "buyCredits", value: amt });
  }
  function doFlip() {
    if (betWei < MIN_BET || betWei > MAX_BET) return;
    setResult(null);
    setLastAction("flip");
    setCoinFace(choiceHeads);
    writeContract({ address: flip, abi: flipAbi, functionName: "flip", args: [betWei, choiceHeads] });
  }
  function doCashOut() {
    if (!chips || chips <= 0n) return;
    setLastAction("cashout");
    writeContract({ address: flip, abi: flipAbi, functionName: "cashOut", args: [chips] });
  }

  // history
  const [history, setHistory] = useState<HistoryItem[]>([]);
  async function loadHistory() {
    if (!publicClient || !address || !configured) { setHistory([]); return; }
    try {
      const logs = await publicClient.getLogs({
        address: flip,
        event: FLIPPED_EVENT,
        args: { player: address },
        fromBlock: START_BLOCK,
      });
      const items: HistoryItem[] = logs
        .map((l) => {
          const a = (l as unknown as { args: { resultHeads: boolean; won: boolean; bet: bigint } }).args;
          return { resultHeads: a.resultHeads, won: a.won, bet: a.bet, tx: l.transactionHash! };
        })
        .reverse()
        .slice(0, 12);
      setHistory(items);
    } catch { setHistory([]); }
  }
  useEffect(() => { loadHistory(); }, [address, chainId, configured]); // eslint-disable-line

  const busy = writing || confirming;

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Xikomu" className="w-7 h-7" />
            <span className="font-playfair text-xl text-[#2C2B29] tracking-tight">Xikomu</span>
            <span className="ml-0.5 text-xs px-2 py-0.5 rounded-full bg-[#FF5E00]/10 text-[#CC4B00] font-medium">Flip</span>
          </Link>
          {mounted && isConnected ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {configured && (
                <span title="Your chips" className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700">
                  <ChipIcon /> {fmt(chips)}
                </span>
              )}
              <span title="Wallet CELO" className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700">
                <CeloIcon /> {fmt(walletBal)}
              </span>
              <span className="hidden sm:inline text-sm font-mono px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700">{shortAddr(address)}</span>
              <button onClick={() => disconnect()} className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-1.5 sm:px-2">Exit</button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 py-8">
        {!mounted ? null : !isConnected ? (
          <ConnectCard />
        ) : !supported ? (
          <Card>
            <h2 className="font-playfair text-2xl text-[#2C2B29] mb-2">Wrong network</h2>
            <p className="text-stone-500 mb-6 text-base font-light">Switch to Celo to play.</p>
            <div className="flex gap-3">
              <PrimaryBtn onClick={() => switchChain({ chainId: celo.id })}>Switch to Celo</PrimaryBtn>
              <GhostBtn onClick={() => switchChain({ chainId: celoSepolia.id })}>Use Celo Sepolia</GhostBtn>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-5">
            {!configured && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-5 py-4 text-sm font-light">
                The game isn&apos;t configured for {CHAIN_LABEL[chainId] ?? "this network"} yet. Deploy XikomuFlip and set
                <code className="mx-1 px-1 rounded bg-amber-100">NEXT_PUBLIC_FLIP_*</code> to play.
              </div>
            )}

            {/* The coin */}
            <Card>
              <div className="flex flex-col items-center py-2">
                <div className="[perspective:800px] mb-5">
                  <div className={`w-36 h-36 ${flipping ? "coin-flipping" : "coin-settle"}`}>
                    <Coin heads={flipping ? coinFace : result ? result.resultHeads : coinFace} />
                  </div>
                </div>

                {flipping ? (
                  <p className="text-stone-500 font-light h-8">Flipping…</p>
                ) : result ? (
                  <div className={`result-pop h-8 text-xl font-medium ${result.won ? "text-emerald-600" : "text-stone-500"}`}>
                    {result.won ? `You won +${fmt(result.payout)} CELO 🎉` : "You lost — try again"}
                  </div>
                ) : (
                  <p className="text-stone-400 font-light h-8">Pick a side and flip</p>
                )}
              </div>

              {/* Choose side */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => setChoiceHeads(true)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 border-2 transition-all ${choiceHeads ? "border-[#FF5E00] bg-[#FF5E00]/5" : "border-stone-200 hover:border-stone-300"}`}>
                  <CoinMini heads /> <span className="font-medium text-stone-800">Heads</span>
                </button>
                <button onClick={() => setChoiceHeads(false)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 border-2 transition-all ${!choiceHeads ? "border-stone-500 bg-stone-100" : "border-stone-200 hover:border-stone-300"}`}>
                  <CoinMini heads={false} /> <span className="font-medium text-stone-800">Tails</span>
                </button>
              </div>

              {/* Bet */}
              <p className="text-sm text-stone-500 mt-5 mb-2 font-light">Bet (CELO) · win pays 1.95×</p>

              {/* Percent of your chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {BET_PCTS.map((p) => (
                  <button key={p} onClick={() => setBetPct(p)} disabled={!chips}
                    className="text-sm rounded-xl px-4 py-2 border bg-white text-stone-600 border-stone-200 hover:border-stone-300 disabled:opacity-40 transition-colors">
                    {p === 100 ? "Max" : `${p}%`}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <input inputMode="decimal" value={bet} onChange={(e) => setBet(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/40"
                placeholder="0.10" />
              <p className="text-xs text-stone-400 mt-1.5 mb-4 font-light">
                Min {fmt(MIN_BET)} · Max {fmt(MAX_BET)} CELO{chips ? ` · you have ${fmt(chips)} chips` : ""}
              </p>

              <button onClick={doFlip} disabled={!configured || busy || !betValid}
                className="w-full bg-[#FF5E00] text-white rounded-full py-4 text-lg font-medium hover:bg-[#CC4B00] transition-colors disabled:opacity-40 shadow-[0_6px_16px_rgba(255, 94, 0,0.35)]">
                {flipping
                  ? "Flipping…"
                  : betWei === 0n
                    ? "Enter a bet"
                    : betWei < MIN_BET
                      ? `Min ${fmt(MIN_BET)} CELO`
                      : betWei > MAX_BET
                        ? `Max ${fmt(MAX_BET)} CELO`
                        : (chips ?? 0n) < betWei
                          ? "Buy more chips below"
                          : `Flip for ${bet} CELO`}
              </button>
            </Card>

            {/* Buy / Cash out */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-playfair text-xl text-[#2C2B29]">Chips</h2>
                <GhostBtn disabled={busy || !chips} onClick={doCashOut}>
                  {busy && lastAction === "cashout" ? "Confirming…" : "Cash out all"}
                </GhostBtn>
              </div>
              <div className="flex gap-2">
                <input inputMode="decimal" value={buyAmt} onChange={(e) => setBuyAmt(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/40"
                  placeholder="1.00" />
                <PrimaryBtn disabled={!configured || busy} onClick={doBuy}>
                  {busy && lastAction === "buy" ? "Confirming…" : "Buy chips"}
                </PrimaryBtn>
              </div>
              <p className="text-xs text-stone-400 mt-3 font-light">1 CELO = 1 chip. Cash out is always available.</p>
            </Card>

            {/* History */}
            <Card>
              <h2 className="font-playfair text-xl text-[#2C2B29] mb-3">Recent flips</h2>
              {history.length === 0 ? (
                <p className="text-stone-400 font-light text-sm">No flips yet.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5">
                      <span className="flex items-center gap-2 text-stone-700">
                        <CoinMini heads={h.resultHeads} /> {h.resultHeads ? "Heads" : "Tails"}
                      </span>
                      <a href={`${explorer}/tx/${h.tx}`} target="_blank" rel="noreferrer"
                        className={`font-medium ${h.won ? "text-emerald-600" : "text-stone-400"} hover:underline`}>
                        {h.won ? "Won" : "Lost"} · {fmt(h.bet)} CELO
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {writeError && (
              <p className="text-sm text-red-500 font-light px-1">
                {(writeError as { shortMessage?: string }).shortMessage ?? "Transaction failed."}
              </p>
            )}

            <p className="text-center text-xs text-stone-400 font-light">
              House pool: {fmt(house)} CELO · provably on-chain, low-stakes fun.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- coin visuals (Heads = orange, Tails = gray) ---------- */
function Coin({ heads }: { heads: boolean }) {
  return heads ? (
    <div className="w-full h-full rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_-6px_rgba(255, 94, 0,0.6)] border-4 border-[#FF8A4D]"
      style={{ background: "radial-gradient(circle at 35% 30%, #FF8A4D, #FF5E00 60%, #CC4B00)" }}>
      <span className="font-playfair text-5xl">H</span>
    </div>
  ) : (
    <div className="w-full h-full rounded-full flex items-center justify-center text-stone-700 shadow-[0_10px_30px_-6px_rgba(0,0,0,0.25)] border-4 border-stone-300"
      style={{ background: "radial-gradient(circle at 35% 30%, #E7E5E4, #A8A29E 60%, #78716C)" }}>
      <span className="font-playfair text-5xl text-white">T</span>
    </div>
  );
}
function CoinMini({ heads }: { heads: boolean }) {
  return (
    <span
      className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[11px] font-bold text-white border"
      style={
        heads
          ? { background: "radial-gradient(circle at 35% 30%, #FF8A4D, #FF5E00)", borderColor: "#FF8A4D" }
          : { background: "radial-gradient(circle at 35% 30%, #D6D3D1, #78716C)", borderColor: "#D6D3D1" }
      }
    >
      {heads ? "H" : "T"}
    </span>
  );
}

/* ---------- balance icons ---------- */
function ChipIcon() {
  // Poker chip — represents in-game chips.
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FF5E00" />
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="#FAFAF8" strokeWidth="1.6" strokeDasharray="2.6 2.2" />
      <circle cx="12" cy="12" r="2.4" fill="#FAFAF8" />
    </svg>
  );
}
function CeloIcon() {
  // CELO coin — two overlapping rings on a coin.
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FCFF52" />
      <circle cx="10" cy="12" r="4.2" fill="none" stroke="#1A1A1A" strokeWidth="1.7" />
      <circle cx="14" cy="12" r="4.2" fill="none" stroke="#1A1A1A" strokeWidth="1.7" />
    </svg>
  );
}

/* ---------- UI atoms ---------- */
function Card({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return <div className={`bg-white rounded-[1.75rem] border border-stone-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.12)] ${compact ? "p-5" : "p-6 sm:p-7"}`}>{children}</div>;
}
function PrimaryBtn({ children, full, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean }) {
  return (
    <button {...p}
      className={`${full ? "w-full" : ""} justify-center bg-[#FF5E00] text-white rounded-full px-7 py-3 font-normal hover:bg-[#CC4B00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(255, 94, 0,0.3)]`}>
      {children}
    </button>
  );
}
function GhostBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p}
      className="justify-center bg-white text-stone-700 rounded-full px-6 py-3 font-normal border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
      {children}
    </button>
  );
}

function ConnectCard() {
  const { connect, connectors, isPending } = useConnect();
  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="[perspective:800px] mb-6 flex justify-center">
          <div className="w-20 h-20 coin-flipping">
            <Coin heads />
          </div>
        </div>
        <h1 className="font-playfair text-4xl text-[#2C2B29] mb-3">Xikomu Lucky Flip</h1>
        <p className="text-stone-500 font-light mb-8">Connect your wallet, pick Heads or Tails, and flip to win 1.95× in CELO.</p>
        <button
          disabled={isPending || !injected}
          onClick={() => injected && connect({ connector: injected })}
          className="bg-[#FF5E00] text-white rounded-full px-8 py-4 text-lg font-normal hover:bg-[#CC4B00] transition-colors disabled:opacity-50 shadow-[0_4px_12px_rgba(255, 94, 0,0.3)]">
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
        <p className="text-xs text-stone-400 mt-4 font-light">In MiniPay this connects automatically.</p>
      </div>
    </div>
  );
}
