import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Xikomu Flip | Coin-flip game on Celo",
  description:
    "Pick a side, flip a coin, win 1.95×. Buy chips with CELO, play in one on-chain transaction, cash out anytime — a MiniPay mini-app on Celo.",
  // talent.app project ownership verification.
  other: {
    "talentapp:project_verification":
      "ef536d63bc50b83a8689e2b145452507a508cfebd70f82324cdec4c83343b9871f37965563e550cfac0209fe042015ac1f12c65b8fa5faa7b197fb2bf3bce43c",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className="bg-[#FAFAF8] text-stone-600 text-xl font-light antialiased min-h-screen flex flex-col relative overflow-x-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
