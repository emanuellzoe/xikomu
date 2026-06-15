"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { request } from "@stacks/connect";
import type { ClarityValue } from "@stacks/transactions";
import {
  FLIP_ID,
  NETWORK_NAME,
  MIN_BET,
  MAX_BET,
  buyCreditsArgs,
  flipArgs,
  cashOutArgs,
  toMicro,
  fmtStx,
  shortAddr,
  netWin,
  maxBetForHouse,
  waitForTx,
  parseFlipResult,
  getFlipHistory,
  EXPLORER,
  type FlipHistoryItem,
} from "@/lib/stacks";
import { ChainToggle, type Chain } from "@/components/ChainToggle";
import { BottomNav, type Tab } from "@/components/BottomNav";
import { useStacksWallet, useFlipData } from "./stacksHooks";
import styles from "./stacks.module.css";

const BET_PCTS = [10, 25, 50, 100];

type Busy = "idle" | "buy" | "flip" | "cashout";

function errMsg(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/cancel|reject|denied/i.test(m)) return "Cancelled in wallet.";
  return m.length > 120 ? "Transaction failed." : m;
}

async function callContract(functionName: string, functionArgs: ClarityValue[]): Promise<string> {
  const res = await request("stx_callContract", {
    contract: FLIP_ID as `${string}.${string}`,
    functionName,
    functionArgs,
    network: NETWORK_NAME,
    postConditionMode: "allow",
  });
  const txid = res?.txid;
  if (!txid) throw new Error("No transaction id returned");
  return txid;
}

export default function StacksFlip({ chain, setChain }: { chain: Chain; setChain: (c: Chain) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, connecting, connect, disconnect } = useStacksWallet();
  const { chips, house, refresh } = useFlipData(address);

  // Which in-app surface is showing: Home (play), Profile, or Riwayat (history).
  const [tab, setTab] = useState<Tab>("home");

  const [choiceHeads, setChoiceHeads] = useState(true);
  const [bet, setBet] = useState("0.1");
  const [buyAmt, setBuyAmt] = useState("1");
  const [result, setResult] = useState<{ won: boolean; resultHeads: boolean } | null>(null);
  const [coinFace, setCoinFace] = useState(true);
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FlipHistoryItem[]>([]);

  async function loadHistory(addr: string | null) {
    if (!addr) {
      setHistory([]);
      return;
    }
    try {
      setHistory(await getFlipHistory(addr));
    } catch {
      setHistory([]);
    }
  }
  useEffect(() => {
    loadHistory(address);
  }, [address]);

  const betMicro = useMemo(() => {
    try {
      return bet ? toMicro(bet) : 0n;
    } catch {
      return 0n;
    }
  }, [bet]);

  const flipping = busy === "flip";
  const houseMaxBet = house !== undefined ? maxBetForHouse(house) : MAX_BET;
  const houseCovers = house !== undefined && house >= netWin(betMicro);
  const betValid =
    betMicro >= MIN_BET && betMicro <= MAX_BET && (chips ?? 0n) >= betMicro && houseCovers;

  function setBetPct(pct: number) {
    if (!chips || chips <= 0n) return;
    let w = (chips * BigInt(pct)) / 100n;
    const cap = houseMaxBet < MAX_BET ? houseMaxBet : MAX_BET;
    if (w > cap) w = cap;
    if (w < MIN_BET) w = MIN_BET;
    setBet(fmtStx(w, 6));
  }

  async function doBuy() {
    const micro = toMicro(buyAmt || "0");
    if (micro <= 0n) return;
    setError(null);
    setBusy("buy");
    try {
      const txid = await callContract("buy-credits", buyCreditsArgs(micro));
      await waitForTx(txid);
      await refresh();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("idle");
    }
  }

  async function doFlip() {
    if (!betValid) return;
    setError(null);
    setResult(null);
    setCoinFace(choiceHeads);
    setBusy("flip");
    try {
      const txid = await callContract("flip", flipArgs(betMicro, choiceHeads));
      const tx = await waitForTx(txid);
      const r = parseFlipResult(tx.tx_result?.repr);
      if (r) {
        setResult(r);
        setCoinFace(r.resultHeads);
      }
      await refresh();
      loadHistory(address);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("idle");
    }
  }

  async function doCashOut() {
    if (!chips || chips <= 0n) return;
    setError(null);
    setBusy("cashout");
    try {
      const txid = await callContract("cash-out", cashOutArgs(chips));
      await waitForTx(txid);
      await refresh();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("idle");
    }
  }

  const anyBusy = busy !== "idle";

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Xikomu" className="w-7 h-7" />
              <span className="font-playfair text-xl text-[#2C2B29] tracking-tight">Xikomu</span>
            </Link>
            <ChainToggle value={chain} onChange={setChain} />
          </div>
          {mounted && address ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                title="Your chips"
                className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700"
              >
                <ChipIcon /> {chips === undefined ? <Sk /> : fmtStx(chips)}
              </span>
              <span className="hidden sm:inline text-sm font-mono px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700">
                {shortAddr(address)}
              </span>
              <button
                onClick={disconnect}
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-1.5 sm:px-2"
              >
                Exit
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 pt-8 pb-28 lg:pb-8">
        {!mounted ? null : !address ? (
          <ConnectCard onConnect={connect} connecting={connecting} />
        ) : (
          <>
            {tab === "home" && (
            <div className="flex flex-col gap-5">
            {/* The coin */}
            <Card>
              <div className="flex flex-col items-center py-2">
                <div className="[perspective:800px] mb-5 relative">
                  {result?.won && !flipping && <Confetti />}
                  <div
                    className={`w-36 h-36 ${flipping ? "coin-flipping" : "coin-settle"} ${
                      result?.won && !flipping ? styles.coinWin : ""
                    }`}
                  >
                    <Coin heads={flipping ? coinFace : result ? result.resultHeads : coinFace} />
                  </div>
                </div>

                {flipping ? (
                  <p className="text-stone-500 font-light h-8">Flipping… confirm in your wallet</p>
                ) : result ? (
                  <div
                    className={`result-pop h-8 text-xl font-medium ${
                      result.won ? "text-emerald-600" : "text-stone-500"
                    }`}
                  >
                    {result.won ? `You won +${fmtStx(netWin(betMicro))} STX 🎉` : "You lost — try again"}
                  </div>
                ) : (
                  <p className="text-stone-400 font-light h-8">Pick a side and flip</p>
                )}
              </div>

              {/* Choose side */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setChoiceHeads(true)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 border-2 transition-all ${
                    choiceHeads ? "border-[#FF5E00] bg-[#FF5E00]/5" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <CoinMini heads /> <span className="font-medium text-stone-800">Heads</span>
                </button>
                <button
                  onClick={() => setChoiceHeads(false)}
                  className={`flex items-center justify-center gap-2 rounded-2xl py-3 border-2 transition-all ${
                    !choiceHeads ? "border-stone-500 bg-stone-100" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <CoinMini heads={false} /> <span className="font-medium text-stone-800">Tails</span>
                </button>
              </div>

              {/* Bet */}
              <p className="text-sm text-stone-500 mt-5 mb-2 font-light">Bet (STX) · win pays 1.95×</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {BET_PCTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setBetPct(p)}
                    disabled={!chips}
                    className="text-sm rounded-xl px-4 py-2 border bg-white text-stone-600 border-stone-200 hover:border-stone-300 disabled:opacity-40 transition-colors"
                  >
                    {p === 100 ? "Max" : `${p}%`}
                  </button>
                ))}
              </div>
              <input
                inputMode="decimal"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/40"
                placeholder="0.10"
              />
              <p className="text-xs text-stone-400 mt-1.5 mb-4 font-light">
                Min {fmtStx(MIN_BET)} · Max {fmtStx(houseMaxBet < MAX_BET ? houseMaxBet : MAX_BET)} STX
                {chips ? ` · you have ${fmtStx(chips)} chips` : ""}
              </p>

              <button
                onClick={doFlip}
                disabled={anyBusy || !betValid}
                className="w-full bg-[#FF5E00] text-white rounded-full py-4 text-lg font-medium hover:bg-[#CC4B00] transition-colors disabled:opacity-40"
                style={{ boxShadow: "0 8px 20px rgba(255, 94, 0, 0.35)" }}
              >
                {flipping
                  ? "Flipping…"
                  : betMicro === 0n
                    ? "Enter a bet"
                    : betMicro < MIN_BET
                      ? `Min ${fmtStx(MIN_BET)} STX`
                      : betMicro > MAX_BET
                        ? `Max ${fmtStx(MAX_BET)} STX`
                        : (chips ?? 0n) < betMicro
                          ? "Buy more chips below"
                          : !houseCovers
                            ? `House max ${fmtStx(houseMaxBet)} STX right now`
                            : `Flip for ${bet} STX`}
              </button>
            </Card>

            {/* Buy / Cash out */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-playfair text-xl text-[#2C2B29]">Chips</h2>
                <GhostBtn disabled={anyBusy || !chips} onClick={doCashOut}>
                  {busy === "cashout" ? "Confirming…" : "Cash out all"}
                </GhostBtn>
              </div>
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  value={buyAmt}
                  onChange={(e) => setBuyAmt(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#FF5E00]/40"
                  placeholder="1.00"
                />
                <PrimaryBtn disabled={anyBusy} onClick={doBuy}>
                  {busy === "buy" ? "Confirming…" : "Buy chips"}
                </PrimaryBtn>
              </div>
              <p className="text-xs text-stone-400 mt-3 font-light">
                1 STX = 1 chip. Cash out is always available.
              </p>
            </Card>

            {error && <p className="text-sm text-red-500 font-light px-1">{error}</p>}

            <p className="text-center text-xs text-stone-400 font-light">
              House pool: {house === undefined ? <Sk w="w-10" /> : fmtStx(house)} STX · Clarity contract on
              Stacks testnet.
            </p>
            <div className="flex items-center justify-center text-xs">
              <a
                href={`${EXPLORER}/txid/${FLIP_ID}?chain=testnet`}
                target="_blank"
                rel="noreferrer"
                className="text-[#5546FF] hover:underline"
              >
                View contract ↗
              </a>
            </div>
            </div>
            )}

            {tab === "profile" && (
              <ProfileTab
                address={address}
                chips={chips}
                house={house}
                onExit={disconnect}
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
                  <div className="w-10 h-10 mb-2 opacity-60">
                    <Coin heads />
                  </div>
                  <p className="text-stone-400 font-light text-sm">No flips yet — your results show up here.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {history.map((h) => (
                    <li key={h.txid}>
                      <a
                        href={`${EXPLORER}/txid/${h.txid}?chain=testnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-stone-50 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-stone-700">
                          <CoinMini heads={h.resultHeads} /> {h.resultHeads ? "Heads" : "Tails"}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-stone-400 text-sm">{fmtStx(h.bet)} STX</span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              h.won ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-500"
                            }`}
                          >
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

      {mounted && address && <BottomNav active={tab} onChange={setTab} />}
    </div>
  );
}

/* ---------- win confetti ---------- */
const CONFETTI = [
  { left: "6%", color: "#FF5E00", delay: "0s" },
  { left: "22%", color: "#10B981", delay: ".04s" },
  { left: "37%", color: "#FF8A4D", delay: ".10s" },
  { left: "50%", color: "#FBBF24", delay: ".02s" },
  { left: "63%", color: "#10B981", delay: ".12s" },
  { left: "78%", color: "#5546FF", delay: ".06s" },
  { left: "94%", color: "#FBBF24", delay: ".09s" },
];
function Confetti() {
  return (
    <div className={styles.confetti} aria-hidden>
      <div className="relative w-36 h-36">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className={styles.confettiPiece}
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
    <div
      className="relative overflow-hidden w-full h-full rounded-full flex items-center justify-center text-white border-4 border-[#FF8A4D]"
      style={{
        background: "radial-gradient(circle at 35% 30%, #FF8A4D, #FF5E00 60%, #CC4B00)",
        boxShadow: "0 12px 30px -6px rgba(255, 94, 0, 0.55)",
      }}
    >
      <CoinShine />
      <span className="font-playfair text-5xl relative">H</span>
    </div>
  ) : (
    <div
      className="relative overflow-hidden w-full h-full rounded-full flex items-center justify-center text-stone-700 border-4 border-stone-300"
      style={{
        background: "radial-gradient(circle at 35% 30%, #E7E5E4, #A8A29E 60%, #78716C)",
        boxShadow: "0 12px 30px -6px rgba(0, 0, 0, 0.25)",
      }}
    >
      <CoinShine />
      <span className="font-playfair text-5xl text-white relative">T</span>
    </div>
  );
}
function CoinShine() {
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

/* ---------- atoms ---------- */
function Sk({ w = "w-8" }: { w?: string }) {
  return <span className={`${styles.skeleton} h-3 ${w} align-middle`} aria-hidden />;
}
function ChipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FF5E00" />
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="#FAFAF8" strokeWidth="1.6" strokeDasharray="2.6 2.2" />
      <circle cx="12" cy="12" r="2.4" fill="#FAFAF8" />
    </svg>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-[1.75rem] border border-stone-200 p-6 sm:p-7"
      style={{ boxShadow: "0 20px 40px -24px rgba(0, 0, 0, 0.12)" }}
    >
      {children}
    </div>
  );
}
function PrimaryBtn(p: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className="justify-center bg-[#FF5E00] text-white rounded-full px-7 py-3 font-normal hover:bg-[#CC4B00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ boxShadow: "0 4px 12px rgba(255, 94, 0, 0.30)" }}
    />
  );
}
function GhostBtn(p: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className="justify-center bg-white text-stone-700 rounded-full px-6 py-3 font-normal border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

/* ---------- Profile tab: wallet + balances at a glance ---------- */
function ProfileTab({
  address,
  chips,
  house,
  onExit,
}: {
  address: string | null;
  chips?: bigint;
  house?: bigint;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-playfair shrink-0"
            style={{
              background: "radial-gradient(circle at 35% 30%, #FF8A4D, #FF5E00 60%, #CC4B00)",
              boxShadow: "0 12px 30px -6px rgba(255, 94, 0, 0.55)",
            }}
          >
            {address ? address.slice(0, 2).toUpperCase() : "?"}
          </div>
          <div className="min-w-0">
            <p className="font-playfair text-xl text-[#2C2B29] leading-tight">Your wallet</p>
            <p className="text-stone-500 font-mono text-sm truncate">{shortAddr(address ?? "")}</p>
          </div>
        </div>
        <dl className="space-y-3">
          <StatRow label="Chips" value={chips === undefined ? "…" : fmtStx(chips)} icon={<ChipIcon />} />
          <StatRow label="House pool" value={house === undefined ? "…" : `${fmtStx(house)} STX`} />
        </dl>
      </Card>

      <Card>
        <a
          href={`${EXPLORER}/address/${address}?chain=testnet`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-2.5 text-stone-700 hover:text-[#FF5E00] transition-colors"
        >
          <span>View your address</span>
          <span aria-hidden>↗</span>
        </a>
        <a
          href={`${EXPLORER}/txid/${FLIP_ID}?chain=testnet`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-2.5 text-stone-700 hover:text-[#FF5E00] transition-colors"
        >
          <span>View game contract</span>
          <span aria-hidden>↗</span>
        </a>
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

function ConnectCard({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="[perspective:800px] mb-6 flex justify-center">
          <div className="w-20 h-20 coin-flipping">
            <Coin heads />
          </div>
        </div>
        <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#5546FF]/10 text-[#5546FF] mb-4">
          On Stacks · win 1.95×
        </span>
        <h1 className="font-playfair text-4xl text-[#2C2B29] mb-3">Xikomu Lucky Flip</h1>
        <p className="text-stone-500 font-light mb-8">
          Connect a Stacks wallet (Xverse or Leather), pick Heads or Tails, and flip to win 1.95× in STX.
        </p>
        <button
          disabled={connecting}
          onClick={onConnect}
          className="bg-[#FF5E00] text-white rounded-full px-8 py-4 text-lg font-normal hover:bg-[#CC4B00] transition-colors disabled:opacity-50"
          style={{ boxShadow: "0 4px 12px rgba(255, 94, 0, 0.30)" }}
        >
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
        <p className="text-xs text-stone-400 mt-4 font-light">Supports Xverse, Leather & other Stacks wallets.</p>
      </div>
    </div>
  );
}
