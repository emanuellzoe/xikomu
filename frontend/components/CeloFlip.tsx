"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav, type Tab } from "@/components/BottomNav";
import { Alert } from "@/components/Alert";
import { describeTxError } from "@/lib/txError";
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
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
  maxBetForHouse,
  netWin,
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

export default function CeloFlip() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Which in-app surface is showing: Home (play), Profile, or Riwayat (history).
  const [tab, setTab] = useState<Tab>("home");

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
  const { data: gameData, refetch: refetchGame, queryKey: gameQueryKey } = useReadContracts({
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
  const { data: walletBalData, refetch: refetchWallet, queryKey: walletQueryKey } = useBalance({
    address,
    query: { enabled: !!address && supported },
  });
  const walletBal = walletBalData?.value;

  const refetchAll = () => { refetchGame(); refetchWallet(); };

  // Keep balances live: invalidate reads on each new block so chips / wallet
  // update after buy / flip / cash-out without a manual page refresh. A single
  // post-tx refetch can race the RPC (read a node that hasn't synced the new
  // block yet); re-invalidating per block self-corrects within a few seconds.
  const queryClient = useQueryClient();
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    query: { enabled: !!address && supported },
  });
  useEffect(() => {
    if (blockNumber === undefined) return;
    queryClient.invalidateQueries({ queryKey: gameQueryKey });
    queryClient.invalidateQueries({ queryKey: walletQueryKey });
  }, [blockNumber]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Largest bet the house pool can pay out on (caps MAX_BET). 0 while loading.
  const houseMaxBet = house !== undefined ? maxBetForHouse(house) : MAX_BET;

  // Set the bet to a percentage of current chips, clamped to what's playable:
  // [MIN_BET, min(MAX_BET, chips, houseMaxBet)].
  function setBetPct(pct: number) {
    if (!chips || chips <= 0n) return;
    let w = (chips * BigInt(pct)) / 100n;
    const cap = houseMaxBet < MAX_BET ? houseMaxBet : MAX_BET;
    if (w > cap) w = cap;
    if (w < MIN_BET) w = MIN_BET;
    setBet(formatUnits(w, CUSD_DECIMALS));
  }
  // House must be able to cover the win (mirrors the contract's InsufficientHouse).
  const houseCovers = house !== undefined && house >= netWin(betWei);
  const betValid =
    betWei >= MIN_BET && betWei <= MAX_BET && (chips ?? 0n) >= betWei && houseCovers;

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

  // Clear any leftover state from the last tx before starting a new one — a
  // stale error / hash from a previous attempt could otherwise block the retry.
  function doBuy() {
    if (busy) return;
    let amt: bigint;
    try { amt = parseUnits(buyAmt || "0", CUSD_DECIMALS); } catch { return; }
    if (amt <= 0n) return;
    reset();
    setLastAction("buy");
    // Native CELO: send value, no token approval.
    writeContract({ address: flip, abi: flipAbi, functionName: "buyCredits", value: amt });
  }
  function doFlip() {
    if (busy) return;
    if (betWei < MIN_BET || betWei > MAX_BET) return;
    reset();
    setResult(null);
    setLastAction("flip");
    setCoinFace(choiceHeads);
    writeContract({ address: flip, abi: flipAbi, functionName: "flip", args: [betWei, choiceHeads] });
  }
  function doCashOut() {
    if (busy) return;
    if (!chips || chips <= 0n) return;
    reset();
    setLastAction("cashout");
    writeContract({ address: flip, abi: flipAbi, functionName: "cashOut", args: [chips] });
  }

  // history
  const [history, setHistory] = useState<HistoryItem[]>([]);
  async function loadHistory() {
    if (!publicClient || !address || !configured) { setHistory([]); return; }
    try {
      // forno rejects eth_getLogs spans of ~10k+ blocks, so scanning from
      // START_BLOCK in one call always fails (and hammers the same RPC the flip
      // receipt poll uses). Walk backwards from the latest block in safe-sized
      // windows, stopping once we have enough recent flips for this player.
      const WINDOW = 5_000n;   // largest span forno accepts per call
      const MAX_CHUNKS = 6;    // cap work: ~30k blocks back, then give up
      const NEED = 12;
      const latest = await publicClient.getBlockNumber();
      const collected: { resultHeads: boolean; won: boolean; bet: bigint; tx: `0x${string}`; block: bigint; idx: number }[] = [];
      let to = latest;
      for (let i = 0; i < MAX_CHUNKS && to >= START_BLOCK && collected.length < NEED; i++) {
        const from = to - WINDOW + 1n > START_BLOCK ? to - WINDOW + 1n : START_BLOCK;
        const logs = await publicClient.getLogs({
          address: flip,
          event: FLIPPED_EVENT,
          args: { player: address },
          fromBlock: from,
          toBlock: to,
        });
        for (const l of logs) {
          const a = (l as unknown as { args: { resultHeads: boolean; won: boolean; bet: bigint } }).args;
          collected.push({ resultHeads: a.resultHeads, won: a.won, bet: a.bet, tx: l.transactionHash!, block: l.blockNumber!, idx: l.logIndex! });
        }
        if (from === START_BLOCK) break;
        to = from - 1n;
      }
      const items: HistoryItem[] = collected
        .sort((a, b) => (a.block === b.block ? b.idx - a.idx : Number(b.block - a.block)))
        .slice(0, NEED)
        .map(({ resultHeads, won, bet, tx }) => ({ resultHeads, won, bet, tx }));
      setHistory(items);
    } catch { setHistory([]); }
  }
  useEffect(() => { loadHistory(); }, [address, chainId, configured]); // eslint-disable-line

  const busy = writing || confirming;

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Xikomu" className="w-8 h-8" />
            </Link>
          </div>
          {mounted && isConnected ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {configured && (
                <span title="Your chips" className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700">
                  <ChipIcon /> {chips === undefined ? <Sk /> : fmt(chips)}
                </span>
              )}
              <span title="Wallet CELO" className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700">
                <CeloIcon /> {walletBal === undefined ? <Sk /> : fmt(walletBal)}
              </span>
              <span className="hidden sm:inline text-sm font-mono px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700">{shortAddr(address)}</span>
              <button onClick={() => disconnect()} className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-1.5 sm:px-2">Exit</button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 pt-8 pb-28 lg:pb-8">
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
          <>
            {tab === "home" && (
            <div className="flex flex-col gap-5">
            {!configured && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-5 py-4 text-sm font-light">
                The game isn&apos;t configured for {CHAIN_LABEL[chainId] ?? "this network"} yet. Deploy XikomuFlip and set
                <code className="mx-1 px-1 rounded bg-amber-100">NEXT_PUBLIC_FLIP_*</code> to play.
              </div>
            )}

            {configured && walletBal === 0n && (
              <Alert variant="warning" title="No CELO for gas">
                Your wallet has 0 CELO. You need a little CELO to pay gas before you can flip, buy chips, or cash out.
              </Alert>
            )}

            {busy && (
              <Alert variant="info" title="Transaction in progress">
                Confirm it in your wallet and wait for it to finish before starting another.
              </Alert>
            )}

            {/* The coin */}
            <Card>
              <div className="flex flex-col items-center py-2">
                <div className="[perspective:800px] mb-5 relative">
                  {result?.won && !flipping && <Confetti />}
                  <div
                    className={`w-36 h-36 ${flipping ? "coin-flipping" : "coin-settle"} ${
                      result?.won && !flipping ? "coin-win" : ""
                    }`}
                  >
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
              <p className="text-sm text-stone-500 font-light mt-5 mb-2">Your call</p>
              <div className="grid grid-cols-2 gap-3">
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
              <div className="flex items-baseline justify-between mt-5 mb-2">
                <p className="text-sm text-stone-500 font-light">Your bet (CELO)</p>
                <span className="text-xs text-stone-400 font-light">win pays 1.95×</span>
              </div>

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
                className="w-full bg-[#FF5E00] text-white rounded-full py-4 text-lg font-medium hover:bg-[#CC4B00] transition-colors disabled:opacity-40 shadow-brand-lg">
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
                          : !houseCovers
                            ? "Bet too high right now"
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
              <p className="text-sm text-stone-500 font-light mb-2">Buy more chips (CELO)</p>
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

            {writeError && (() => {
              const e = describeTxError(writeError);
              return <Alert variant="error" title={e.title} onClose={() => reset()}>{e.message}</Alert>;
            })()}

            <p className="text-center text-xs text-stone-400 font-light">
              Provably fair on-chain · low-stakes fun.
            </p>
            </div>
            )}

            {tab === "profile" && (
              <ProfileTab
                address={address}
                chips={chips}
                walletBal={walletBal}
                explorer={explorer}
                flip={flip}
                onExit={() => disconnect()}
              />
            )}

            {tab === "riwayat" && (
            <div className="flex flex-col gap-5">
            {/* History */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-playfair text-xl text-[#2C2B29]">Recent flips</h2>
                {history.length > 0 && (
                  <span className="text-xs text-stone-400 font-light">{history.length} shown</span>
                )}
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-10 h-10 mb-2 opacity-60"><Coin heads /></div>
                  <p className="text-stone-400 font-light text-sm">No flips yet — your results show up here.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {history.map((h, i) => (
                    <li key={i}>
                      <a href={`${explorer}/tx/${h.tx}`} target="_blank" rel="noreferrer"
                        className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-stone-50 transition-colors">
                        <span className="flex items-center gap-2 text-stone-700">
                          <CoinMini heads={h.resultHeads} /> {h.resultHeads ? "Heads" : "Tails"}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-stone-400 text-sm">{fmt(h.bet)} CELO</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.won ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-500"}`}>
                            {h.won ? "Won" : "Lost"}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            </div>
            )}
          </>
        )}
      </main>

      {mounted && isConnected && supported && <BottomNav active={tab} onChange={setTab} />}
    </div>
  );
}

/* ---------- win confetti (predefined pieces — no randomness/hydration drift) ---------- */
const CONFETTI = [
  { left: "6%", color: "#FF5E00", delay: "0s" },
  { left: "20%", color: "#10B981", delay: ".04s" },
  { left: "33%", color: "#FF8A4D", delay: ".10s" },
  { left: "46%", color: "#FBBF24", delay: ".02s" },
  { left: "58%", color: "#10B981", delay: ".12s" },
  { left: "70%", color: "#FF5E00", delay: ".06s" },
  { left: "84%", color: "#FBBF24", delay: ".09s" },
  { left: "94%", color: "#FF8A4D", delay: ".14s" },
];
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 flex justify-center" aria-hidden>
      <div className="relative w-36 h-36">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{ left: c.left, background: c.color, animationDelay: c.delay }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- coin visuals (Heads = orange, Tails = gray) ---------- */
function Coin({ heads }: { heads: boolean }) {
  return heads ? (
    <div className="relative overflow-hidden w-full h-full rounded-full flex items-center justify-center text-white shadow-coin border-4 border-[#FF8A4D]"
      style={{ background: "radial-gradient(circle at 35% 30%, #FF8A4D, #FF5E00 60%, #CC4B00)" }}>
      <CoinShine />
      <span className="font-playfair text-5xl relative">H</span>
    </div>
  ) : (
    <div className="relative overflow-hidden w-full h-full rounded-full flex items-center justify-center text-stone-700 shadow-coin-gray border-4 border-stone-300"
      style={{ background: "radial-gradient(circle at 35% 30%, #E7E5E4, #A8A29E 60%, #78716C)" }}>
      <CoinShine />
      <span className="font-playfair text-5xl text-white relative">T</span>
    </div>
  );
}
function CoinShine() {
  // Soft glossy highlight in the top-left for a minted-coin feel.
  return (
    <span
      className="pointer-events-none absolute -top-2 -left-1 w-20 h-20 rounded-full opacity-60"
      style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0) 60%)" }}
      aria-hidden
    />
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

/* ---------- skeleton (shown while an on-chain read is still loading) ---------- */
function Sk({ w = "w-8" }: { w?: string }) {
  return <span className={`skeleton h-3 ${w} align-middle`} aria-hidden />;
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
  return <div className={`bg-white rounded-[1.75rem] border border-stone-200 shadow-card ${compact ? "p-5" : "p-6 sm:p-7"}`}>{children}</div>;
}
function PrimaryBtn({ children, full, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean }) {
  return (
    <button {...p}
      className={`${full ? "w-full" : ""} justify-center bg-[#FF5E00] text-white rounded-full px-7 py-3 font-normal hover:bg-[#CC4B00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-brand`}>
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

/* ---------- Profile tab: wallet + balances at a glance ---------- */
function ProfileTab({
  address,
  chips,
  walletBal,
  explorer,
  flip,
  onExit,
}: {
  address?: Address;
  chips?: bigint;
  walletBal?: bigint;
  explorer: string;
  flip: Address;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-playfair shrink-0 shadow-coin"
            style={{ background: "radial-gradient(circle at 35% 30%, #FF8A4D, #FF5E00 60%, #CC4B00)" }}
          >
            {address ? address.slice(2, 4).toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <p className="font-playfair text-xl text-[#2C2B29] leading-tight">Your wallet</p>
            <p className="text-stone-500 font-mono text-sm truncate">{shortAddr(address)}</p>
          </div>
        </div>
        <dl className="space-y-3">
          <StatRow label="Chips" value={chips === undefined ? "…" : fmt(chips)} icon={<ChipIcon />} />
          <StatRow label="Wallet CELO" value={walletBal === undefined ? "…" : fmt(walletBal)} icon={<CeloIcon />} />
        </dl>
      </Card>

      <Card>
        <ProfileLink href={`${explorer}/address/${address}`}>View your address</ProfileLink>
        <ProfileLink href={`${explorer}/address/${flip}`}>View game contract</ProfileLink>
        <button
          onClick={onExit}
          className="mt-3 w-full justify-center bg-white text-stone-700 rounded-full px-6 py-3 font-normal border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors"
        >
          Disconnect
        </button>
      </Card>
    </div>
  );
}
function StatRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-stone-500 font-light flex items-center gap-2">{icon}{label}</dt>
      <dd className="text-[#2C2B29] font-medium">{value}</dd>
    </div>
  );
}
function ProfileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between py-2.5 text-stone-700 hover:text-[#FF5E00] transition-colors"
    >
      <span>{children}</span>
      <span aria-hidden>↗</span>
    </a>
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
        <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#FF5E00]/10 text-[#CC4B00] mb-4">
          Win 1.95× · one on-chain flip
        </span>
        <h1 className="font-playfair text-4xl text-[#2C2B29] mb-3">Xikomu Lucky Flip</h1>
        <p className="text-stone-500 font-light mb-7">Connect your wallet, pick Heads or Tails, and flip to win 1.95× in CELO.</p>

        {/* how it works */}
        <div className="flex items-center justify-center gap-2 mb-8 text-sm text-stone-500">
          <Step n={1} label="Pick a side" />
          <span className="text-stone-300">→</span>
          <Step n={2} label="Flip" />
          <span className="text-stone-300">→</span>
          <Step n={3} label="Win 1.95×" />
        </div>

        <button
          disabled={isPending || !injected}
          onClick={() => injected && connect({ connector: injected })}
          className="bg-[#FF5E00] text-white rounded-full px-8 py-4 text-lg font-normal hover:bg-[#CC4B00] transition-colors disabled:opacity-50 shadow-brand">
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
        <p className="text-xs text-stone-400 mt-4 font-light">In MiniPay this connects automatically.</p>
      </div>
    </div>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
        {n}
      </span>
      <span className="font-light">{label}</span>
    </span>
  );
}
