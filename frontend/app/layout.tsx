import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Xikomu | Automatic Savings on Celo",
  description:
    "Set a savings plan once and let an on-chain keeper move cUSD into your vault on schedule. Non-custodial, withdraw anytime — a MiniPay mini-app on Celo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className="bg-[#FAFAF8] text-stone-600 text-xl font-light antialiased min-h-screen flex flex-col relative overflow-x-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Providers>{children}</Providers>
        {/* Icon libraries used by the template markup */}
        <Script
          src="https://code.iconify.design/iconify-icon/1.0.8/iconify-icon.min.js"
          strategy="afterInteractive"
        />
        <Script src="https://unpkg.com/lucide@latest" strategy="afterInteractive" />
      </body>
    </html>
  );
}
