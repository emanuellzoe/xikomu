import Link from "next/link";

/* ---------- small coin visuals ---------- */
function CoinFace({ heads, className = "" }: { heads: boolean; className?: string }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center border-4 ${className}`}
      style={
        heads
          ? {
              background: "radial-gradient(circle at 35% 30%, #FF8A4D, #FF5E00 60%, #CC4B00)",
              borderColor: "#FF8A4D",
              boxShadow: "0 18px 40px -10px rgba(255, 94, 0,0.6)",
            }
          : {
              background: "radial-gradient(circle at 35% 30%, #E7E5E4, #A8A29E 60%, #78716C)",
              borderColor: "#D6D3D1",
              boxShadow: "0 18px 40px -12px rgba(0,0,0,0.3)",
            }
      }
    >
      <span className="font-playfair text-white">{heads ? "H" : "T"}</span>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-7">
      <div className="w-9 h-9 rounded-full bg-[#FF5E00] text-white flex items-center justify-center font-medium mb-4">
        {n}
      </div>
      <h3 className="font-playfair text-2xl text-[#2C2B29] mb-2">{title}</h3>
      <p className="text-base text-stone-500 font-light leading-relaxed">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-stone-200 bg-white px-6 py-5">
      <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-stone-800">
        {q}
        <span className="text-[#FF5E00] transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
      </summary>
      <p className="mt-3 text-base text-stone-500 font-light leading-relaxed">{a}</p>
    </details>
  );
}

export default function Landing() {
  return (
    <div className="w-full">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/80 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Xikomu" className="w-7 h-7" />
            <span className="font-playfair text-xl text-[#2C2B29] tracking-tight">Xikomu</span>
            <span className="ml-0.5 text-xs px-2 py-0.5 rounded-full bg-[#FF5E00]/10 text-[#CC4B00] font-medium">Flip</span>
          </div>
          <Link
            href="/app"
            className="bg-[#FF5E00] text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-[#CC4B00] transition-colors shadow-[0_6px_16px_rgba(255, 94, 0,0.35)]"
          >
            Launch App
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-[#FF5E00]/10 text-[#CC4B00] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E00]" /> A coin-flip game on Celo
            </span>
            <h1 className="font-playfair text-5xl sm:text-6xl leading-[1.05] text-[#2C2B29] mb-5">
              Pick a side.
              <br />
              Flip. Win <span className="text-[#FF5E00]">1.95×</span>.
            </h1>
            <p className="text-lg text-stone-500 font-light leading-relaxed mb-8 max-w-md">
              Buy chips with CELO, call Heads or Tails, and every flip settles in one on-chain
              transaction. Provably fair, low-stakes fun — cash out anytime.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/app"
                className="bg-[#FF5E00] text-white rounded-full px-7 py-3.5 text-lg font-medium hover:bg-[#CC4B00] transition-colors shadow-[0_8px_20px_rgba(255, 94, 0,0.35)]"
              >
                Play now
              </Link>
              <a href="#how" className="text-stone-500 hover:text-stone-900 transition-colors font-light">
                How it works ↓
              </a>
            </div>
          </div>

          {/* Coin cluster */}
          <div className="relative h-72 sm:h-96 flex items-center justify-center">
            <CoinFace heads className="w-44 h-44 sm:w-56 sm:h-56 text-6xl sm:text-7xl rotate-[-8deg]" />
            <div className="absolute right-6 top-6 sm:right-12">
              <CoinFace heads={false} className="w-24 h-24 sm:w-28 sm:h-28 text-3xl sm:text-4xl rotate-[12deg]" />
            </div>
            <div className="absolute left-2 bottom-4 sm:left-8">
              <CoinFace heads={false} className="w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl rotate-[-18deg]" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white border-y border-stone-200/70">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <h2 className="font-playfair text-3xl sm:text-4xl text-[#2C2B29] mb-3 text-center">How it works</h2>
          <p className="text-stone-500 font-light text-center mb-12 max-w-lg mx-auto">
            Three taps from wallet to win. No accounts, no custody — just play.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <Step n={1} title="Buy chips" body="Top up chips with CELO at 1:1. Chips are your in-game balance — never custodial." />
            <Step n={2} title="Flip a coin" body="Pick Heads or Tails and set your bet. Each flip is one on-chain transaction." />
            <Step n={3} title="Win 1.95× or cash out" body="Win and your chips grow 1.95×. Cash chips back to CELO whenever you like." />
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="font-playfair text-3xl sm:text-4xl text-[#2C2B29] mb-12 text-center">Built to be fair</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            ["Provably on-chain", "Every flip's result is decided and settled by the smart contract — verifiable on Celoscan, no hidden server."],
            ["Cash out anytime", "Withdrawing your chips always works — even if the game is paused. Your balance is yours."],
            ["The house can't touch your chips", "The owner can only manage the house pool. Player chips are off-limits, by design."],
            ["Real on-chain activity", "1 flip = 1 transaction. Fast, cheap, and a genuinely on-chain game on Celo."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-3xl border border-stone-200 bg-white p-7">
              <h3 className="font-playfair text-xl text-[#2C2B29] mb-2">{title}</h3>
              <p className="text-base text-stone-500 font-light leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-stone-200/70">
        <div className="max-w-3xl mx-auto px-5 py-20">
          <h2 className="font-playfair text-3xl sm:text-4xl text-[#2C2B29] mb-10 text-center">FAQ</h2>
          <div className="flex flex-col gap-3">
            <Faq q="What do I bet with?" a="CELO. You convert CELO into chips (1:1), then bet chips on each flip. Chips cash back to CELO anytime." />
            <Faq q="How much can I win?" a="A winning flip pays 1.95× your bet — your stake back plus 0.95× profit. A losing bet goes to the house pool." />
            <Faq q="Is it fair?" a="The coin result is computed on-chain by the contract, and the whole contract is open source and verified on Celoscan." />
            <Faq q="Can I lose my deposit?" a="Only what you actually bet is at risk. Chips you haven't wagered can always be cashed out for CELO." />
          </div>
        </div>
      </section>

      {/* CTA + footer */}
      <section className="max-w-5xl mx-auto px-5 py-20 text-center">
        <h2 className="font-playfair text-4xl sm:text-5xl text-[#2C2B29] mb-4">Ready to flip?</h2>
        <p className="text-stone-500 font-light mb-8">Pick a side and find out — your luck is one tap away.</p>
        <Link
          href="/app"
          className="inline-block bg-[#FF5E00] text-white rounded-full px-8 py-4 text-lg font-medium hover:bg-[#CC4B00] transition-colors shadow-[0_8px_20px_rgba(255, 94, 0,0.35)]"
        >
          Launch the game
        </Link>
      </section>

      <footer className="border-t border-stone-200/70">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone-400 font-light">
          <span>Xikomu Flip · a MiniPay mini-app on Celo</span>
          <span>Provably on-chain · open source</span>
        </div>
      </footer>
    </div>
  );
}
