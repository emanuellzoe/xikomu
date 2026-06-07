"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { formatUnits, parseUnits, maxUint256, parseAbiItem, type Address } from "viem";
import {
  CUSD,
  CUSD_DECIMALS,
  START_BLOCK,
  VAULT,
  ZERO_ADDRESS,
  erc20Abi,
  isConfigured,
  vaultAbi,
} from "@/lib/contracts";

const INTERVALS = [
  { label: "Every minute (test)", value: 60 },
  { label: "Daily", value: 86_400 },
  { label: "Weekly", value: 604_800 },
  { label: "Monthly", value: 2_592_000 },
];

const SAVED_EVENT = parseAbiItem(
  "event Saved(address indexed user, uint128 amount, uint64 nextRun, uint256 newBalance)",
);
const WITHDRAWN_EVENT = parseAbiItem("event Withdrawn(address indexed user, uint256 amount)");

function fmt(v?: bigint, max = 2): string {
  if (v === undefined) return "0";
  return Number(formatUnits(v, CUSD_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: max });
}

function intervalLabel(seconds: number): string {
  const found = INTERVALS.find((i) => i.value === seconds);
  if (found) return found.label;
  if (seconds % 86_400 === 0) return `Every ${seconds / 86_400} days`;
  if (seconds % 3_600 === 0) return `Every ${seconds / 3_600} hours`;
  return `Every ${seconds}s`;
}

function shortAddr(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function countdown(nextRun: number): string {
  const now = Math.floor(Date.now() / 1000);
  let d = nextRun - now;
  if (d <= 0) return "due now";
  const days = Math.floor(d / 86_400); d -= days * 86_400;
  const hrs = Math.floor(d / 3_600); d -= hrs * 3_600;
  const min = Math.floor(d / 60);
  if (days > 0) return `in ${days}d ${hrs}h`;
  if (hrs > 0) return `in ${hrs}h ${min}m`;
  return `in ${min}m`;
}

type HistoryItem = { kind: "Saved" | "Withdrawn"; amount: bigint; tx: string };

export default function AppPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();

  const supported = chainId === celo.id || chainId === celoAlfajores.id;
  const configured = supported && isConfigured(chainId);
  const vault = (supported ? VAULT[chainId] : ZERO_ADDRESS) as Address;
  const cusd = (supported ? CUSD[chainId] : ZERO_ADDRESS) as Address;

  // Auto-connect inside MiniPay
  useEffect(() => {
    if (!mounted || isConnected) return;
    const eth = (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    if (eth?.isMiniPay) {
      const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
      if (injected) connect({ connector: injected });
    }
  }, [mounted, isConnected, connect, connectors]);

  // ----- reads -----
  const { data: vaultData, refetch: refetchVault } = useReadContracts({
    contracts:
      configured && address
        ? [
            { address: vault, abi: vaultAbi, functionName: "balanceOf", args: [address] },
            { address: vault, abi: vaultAbi, functionName: "getPlan", args: [address] },
          ]
        : [],
    query: { enabled: configured && !!address },
  });
  const saved = vaultData?.[0]?.result as bigint | undefined;
  const plan = vaultData?.[1]?.result as { amount: bigint; interval: bigint; nextRun: bigint } | undefined;
  const hasPlan = !!plan && plan.amount > 0n;

  const { data: walletData, refetch: refetchWallet } = useReadContracts({
    contracts:
      address && supported
        ? [
            { address: cusd, abi: erc20Abi, functionName: "balanceOf", args: [address] },
            { address: cusd, abi: erc20Abi, functionName: "allowance", args: [address, vault] },
          ]
        : [],
    query: { enabled: !!address && supported },
  });
  const walletBal = walletData?.[0]?.result as bigint | undefined;
  const allowance = (walletData?.[1]?.result as bigint | undefined) ?? 0n;

  const refetchAll = () => { refetchVault(); refetchWallet(); };

  // ----- writes -----
  const { writeContract, data: txHash, isPending: writing, error: writeError, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => { if (confirmed) { refetchAll(); loadHistory(); reset(); } }, [confirmed]); // eslint-disable-line

  // ----- form state -----
  const [amount, setAmount] = useState("5");
  const [interval, setIntervalSec] = useState(86_400);
  const [withdrawAmt, setWithdrawAmt] = useState("");

  const amountWei = useMemo(() => {
    try { return amount ? parseUnits(amount, CUSD_DECIMALS) : 0n; } catch { return 0n; }
  }, [amount]);
  const needsApproval = amountWei > 0n && allowance < maxUint256 / 2n;

  function approve() {
    writeContract({ address: cusd, abi: erc20Abi, functionName: "approve", args: [vault, maxUint256] });
  }
  function createPlan() {
    if (amountWei <= 0n) return;
    writeContract({ address: vault, abi: vaultAbi, functionName: "createPlan", args: [amountWei, BigInt(interval)] });
  }
  function cancelPlan() {
    writeContract({ address: vault, abi: vaultAbi, functionName: "cancelPlan", args: [] });
  }
  function withdraw(all = false) {
    const amt = all ? (saved ?? 0n) : (() => { try { return parseUnits(withdrawAmt || "0", CUSD_DECIMALS); } catch { return 0n; } })();
    if (amt <= 0n) return;
    writeContract({ address: vault, abi: vaultAbi, functionName: "withdraw", args: [amt] });
  }

  // ----- history (events) -----
  const [history, setHistory] = useState<HistoryItem[]>([]);
  async function loadHistory() {
    if (!publicClient || !address || !configured) { setHistory([]); return; }
    try {
      const [savedLogs, wdLogs] = await Promise.all([
        publicClient.getLogs({ address: vault, event: SAVED_EVENT, args: { user: address }, fromBlock: START_BLOCK }),
        publicClient.getLogs({ address: vault, event: WITHDRAWN_EVENT, args: { user: address }, fromBlock: START_BLOCK }),
      ]);
      const items: HistoryItem[] = [
        ...savedLogs.map((l) => ({ kind: "Saved" as const, amount: l.args.amount ?? 0n, tx: l.transactionHash! })),
        ...wdLogs.map((l) => ({ kind: "Withdrawn" as const, amount: l.args.amount ?? 0n, tx: l.transactionHash! })),
      ].reverse().slice(0, 10);
      setHistory(items);
    } catch { setHistory([]); }
  }
  useEffect(() => { loadHistory(); }, [address, chainId, configured]); // eslint-disable-line

  const busy = writing || confirming;
  const explorer = chainId === celo.id ? "https://celoscan.io" : "https://alfajores.celoscan.io";

  // ---------- render ----------
  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-[#E8A07E] font-light tracking-widest text-xl uppercase">Xiko</span>
            <span className="text-[#C96442] font-normal text-xl tracking-tight -ml-1">mu</span>
          </Link>
          {mounted && isConnected ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600">
                {chainId === celo.id ? "Celo" : chainId === celoAlfajores.id ? "Alfajores" : "Unsupported"}
              </span>
              <span className="text-sm font-mono px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-700">{shortAddr(address)}</span>
              <button onClick={() => disconnect()} className="text-sm text-stone-500 hover:text-stone-900 transition-colors px-2">Exit</button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-8">
        {!mounted ? null : !isConnected ? (
          <ConnectCard />
        ) : !supported ? (
          <Card>
            <h2 className="font-playfair text-2xl text-[#2C2B29] mb-2">Wrong network</h2>
            <p className="text-stone-500 mb-6 text-base font-light">Switch to Celo to use Xikomu.</p>
            <div className="flex gap-3">
              <PrimaryBtn onClick={() => switchChain({ chainId: celo.id })}>Switch to Celo</PrimaryBtn>
              <GhostBtn onClick={() => switchChain({ chainId: celoAlfajores.id })}>Use Alfajores</GhostBtn>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-5">
            {!configured && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-5 py-4 text-sm font-light">
                The AutoSaveVault contract isn&apos;t configured for this network yet. Deploy it and set
                <code className="mx-1 px-1 rounded bg-amber-100">NEXT_PUBLIC_VAULT_{chainId === celo.id ? "CELO" : "ALFAJORES"}</code>
                to enable saving.
              </div>
            )}

            {/* Balance */}
            <Card>
              <p className="uppercase text-xs tracking-widest text-stone-400 font-medium mb-2">Your savings</p>
              <div className="flex items-end gap-2">
                <span className="font-playfair text-5xl text-[#2C2B29] leading-none">{fmt(saved)}</span>
                <span className="text-lg text-stone-400 mb-1">cUSD</span>
              </div>
              <p className="text-sm text-stone-400 mt-3 font-light">Wallet balance: {fmt(walletBal)} cUSD</p>
            </Card>

            {/* Plan */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-playfair text-2xl text-[#2C2B29]">{hasPlan ? "Your plan" : "Start an auto-save plan"}</h2>
                {hasPlan && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#C96442]/10 text-[#A84F2E] font-medium">Active</span>
                )}
              </div>

              {hasPlan && plan && (
                <div className="rounded-2xl bg-[#FAFAF8] border border-stone-200 p-4 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-normal text-stone-900">{fmt(plan.amount)} <span className="text-base text-stone-400">cUSD</span></p>
                    <p className="text-sm text-stone-500 font-light">{intervalLabel(Number(plan.interval))}</p>
                  </div>
                  <div className="text-right">
                    <p className="uppercase text-[10px] tracking-widest text-stone-400">Next save</p>
                    <p className="text-stone-700">{countdown(Number(plan.nextRun))}</p>
                  </div>
                </div>
              )}

              <label className="block text-sm text-stone-500 mb-1 font-light">Amount per save (cUSD)</label>
              <input
                inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C96442]/40 mb-4"
                placeholder="5"
              />
              <label className="block text-sm text-stone-500 mb-1 font-light">Frequency</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {INTERVALS.map((opt) => (
                  <button key={opt.value} onClick={() => setIntervalSec(opt.value)}
                    className={`text-sm rounded-xl px-2 py-2.5 border transition-colors ${interval === opt.value ? "bg-[#C96442] text-white border-[#C96442]" : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {needsApproval ? (
                  <PrimaryBtn disabled={!configured || busy} onClick={approve}>{busy ? "Confirming…" : "Approve cUSD"}</PrimaryBtn>
                ) : (
                  <PrimaryBtn disabled={!configured || busy || amountWei <= 0n} onClick={createPlan}>
                    {busy ? "Confirming…" : hasPlan ? "Update Plan" : "Create Plan"}
                  </PrimaryBtn>
                )}
                {hasPlan && <GhostBtn disabled={busy} onClick={cancelPlan}>Cancel plan</GhostBtn>}
              </div>
              <p className="text-xs text-stone-400 mt-3 font-light">
                The keeper moves cUSD into your vault on schedule. First save runs after one interval. You can withdraw anytime.
              </p>
            </Card>

            {/* Withdraw */}
            <Card>
              <h2 className="font-playfair text-2xl text-[#2C2B29] mb-4">Withdraw</h2>
              <div className="flex gap-2 mb-3">
                <input inputMode="decimal" value={withdrawAmt} onChange={(e) => setWithdrawAmt(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C96442]/40"
                  placeholder="0.00" />
                <GhostBtn disabled={busy || !saved} onClick={() => setWithdrawAmt(saved ? formatUnits(saved, CUSD_DECIMALS) : "0")}>Max</GhostBtn>
              </div>
              <div className="flex gap-3">
                <PrimaryBtn disabled={!configured || busy || !withdrawAmt} onClick={() => withdraw(false)}>{busy ? "Confirming…" : "Withdraw"}</PrimaryBtn>
                <GhostBtn disabled={!configured || busy || !saved} onClick={() => withdraw(true)}>Withdraw all</GhostBtn>
              </div>
              <p className="text-xs text-stone-400 mt-3 font-light">Withdrawals are always available — even if saving is paused.</p>
            </Card>

            {/* History */}
            <Card>
              <h2 className="font-playfair text-2xl text-[#2C2B29] mb-4">Recent activity</h2>
              {history.length === 0 ? (
                <p className="text-stone-400 font-light text-sm">No activity yet.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-stone-700">
                        <iconify-icon icon={h.kind === "Saved" ? "solar:add-circle-linear" : "solar:wallet-linear"} className="text-[#C96442] text-xl" />
                        {h.kind}
                      </span>
                      <a href={`${explorer}/tx/${h.tx}`} target="_blank" rel="noreferrer"
                        className={`font-medium ${h.kind === "Saved" ? "text-emerald-600" : "text-stone-700"} hover:underline`}>
                        {h.kind === "Saved" ? "+" : "−"}{fmt(h.amount)} cUSD
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
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- small UI atoms (Claude-orange themed) ---------- */
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-[1.75rem] border border-stone-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.12)] p-6 sm:p-7">{children}</div>;
}
function PrimaryBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p}
      className="flex-1 sm:flex-none justify-center bg-[#C96442] text-white rounded-full px-7 py-3 font-normal hover:bg-[#A84F2E] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(201,100,66,0.3)]">
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
        <div className="w-16 h-16 rounded-2xl bg-[#C96442]/10 border border-[#C96442]/20 flex items-center justify-center mx-auto mb-6">
          <iconify-icon icon="solar:wallet-money-linear" className="text-3xl text-[#C96442]" />
        </div>
        <h1 className="font-playfair text-4xl text-[#2C2B29] mb-3">Welcome to Xikomu</h1>
        <p className="text-stone-500 font-light mb-8">Connect your wallet to set up an automatic, non-custodial savings plan in cUSD.</p>
        <button
          disabled={isPending || !injected}
          onClick={() => injected && connect({ connector: injected })}
          className="bg-[#C96442] text-white rounded-full px-8 py-4 text-lg font-normal hover:bg-[#A84F2E] transition-colors disabled:opacity-50 shadow-[0_4px_12px_rgba(201,100,66,0.3)]">
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
        <p className="text-xs text-stone-400 mt-4 font-light">In MiniPay this connects automatically.</p>
      </div>
    </div>
  );
}
